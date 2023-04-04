import { AllOptionalExceptFor, BoomUser, RoleKey } from '@boom-platform/globals';
import { Getter, inject } from '@loopback/core';
import { FilterBuilder, repository } from '@loopback/repository';
import { del, get, HttpErrors, param, post, Request, Response, RestBindings } from '@loopback/rest';
import { serviceProxy } from '@loopback/service-proxy';
import fs from 'fs';
import { promisify } from 'util';

import { AuthorizatonBindings, authorize } from '../authorization';
import { ProfileResponseMessages, ServiceResponseCodes } from '../constants';
import * as config from '../datasources/storage.datasource.json';
import { IStorageService } from '../interfaces';
import { File, Image } from '../models';
import { ImageRepository } from '../repositories';

const STORAGE_CONTAINER_NAME = process.env.OBJECT_STORAGE_BUCKET_NAME_FOR_IMAGES || 'moob-images';
const STORAGE_CONTAINER_UPLOAD_PATH = `${STORAGE_CONTAINER_NAME}/${process.env.OBJECT_STORAGE_ENV_DIRECTORY_FOR_IMAGES}/uploaded`;
const STORAGE_CONTAINER_RESIZED_PATH = `${STORAGE_CONTAINER_NAME}/${process.env.OBJECT_STORAGE_ENV_DIRECTORY_FOR_IMAGES}/resized`;

const sharp = require('sharp');
const pipeStreams = require('pipe-streams-to-promise');
const formidable = require('formidable');

export class ImageController {
  @serviceProxy('Storage')
  private storageService: IStorageService;

  constructor(
    @inject(RestBindings.Http.REQUEST) public request: Request,
    @inject(RestBindings.Http.RESPONSE) public response: Response,
    @inject.getter(AuthorizatonBindings.CURRENT_USER)
    public currentUserGetter: Getter<AllOptionalExceptFor<BoomUser, 'roles' | 'uid'> | undefined>,
    @repository(ImageRepository)
    public imageRepository: ImageRepository
  ) {}

  @authorize([RoleKey.Member, RoleKey.Merchant, RoleKey.Admin, RoleKey.SuperAdmin])
  @post('/images/{fileName}', {
    responses: {
      '200': {
        description: 'Upload a image into Storage Container',
        content: { 'application/json': { schema: { 'x-ts-type': File } } },
      },
    },
  })
  async upload(
    @param.path.string('fileName') fileName: string,
    @param.query.boolean('override') override = false
  ): Promise<any> {
    const uploadStream = this.storageService.uploadStream;
    const download = promisify(this.storageService.download);
    const getFile = promisify(this.storageService.getFile);
    const removeFile = promisify(this.storageService.removeFile);
    const imageRepo = this.imageRepository;
    const request = this.request;
    const response = this.response;

    const currentUser: AllOptionalExceptFor<BoomUser, 'roles' | 'uid'> | undefined =
      await this.currentUserGetter();
    if (!currentUser) throw new HttpErrors.NotFound(ProfileResponseMessages.MEMBER_NOT_FOUND);

    const filterBuilder = new FilterBuilder<Image>();
    const filter = filterBuilder.where({ fileName }).order('uploadedBy DESC').build();
    const images = await imageRepo.find(filter);

    if (images.length > 0) {
      // if force to override the image then check access to the logged in user
      if (currentUser && override === true && images[0].uploadedBy === currentUser.uid) {
        for (const image of images) {
          const filePath = image.path;
          const tempFileName = filePath.replace(`${STORAGE_CONTAINER_RESIZED_PATH}/`, '');
          await removeFile(STORAGE_CONTAINER_RESIZED_PATH, tempFileName);
          await imageRepo.delete(image);
        }
      } else if (override === true) {
        throw new HttpErrors.Unauthorized('You do not have the rights to update this image');
      } else {
        throw new HttpErrors.Conflict(`Image already exists with the name [${fileName}]`);
      }
    }

    await new Promise<object>((resolve, reject) => {
      const form = new formidable.IncomingForm();
      form.parse(request, function (err: any, fields: any, files: any) {
        if (Object.keys(files).length === 0) {
          return reject(new HttpErrors.BadRequest(`File not provided to upload`));
        }
        // pick first file object
        const fileFieldKey = Object.keys(files).shift();
        const fileField = files[fileFieldKey || 'file'];

        if (!config.allowedContentTypes.includes(fileField.type)) {
          return reject(new HttpErrors.BadRequest(`File type(${fileField.type}) not allowed`));
        } else if (parseInt(fileField.size, 10) > parseInt(config.maxFileSize, 10)) {
          return reject(
            new HttpErrors.BadRequest(
              `File size is more then allowed size ${
                parseInt(config.maxFileSize, 10) / (1024 * 1024)
              }MB`
            )
          );
        } else {
          // used sharp lib to
          // 1. Adjust Image EXIF data if orientation is Rotate
          // 2. Optimize image, default=80, save image to jpeg
          const transformer = sharp().rotate().jpeg();
          const writableStream = uploadStream(
            STORAGE_CONTAINER_UPLOAD_PATH,
            `${fileName}.jpeg`,
            config
          );
          const readableStream = fs.createReadStream(fileField.path);
          let errorAlreadyRejected = false;
          writableStream.on('success', function (file: any) {
            const tempImage: Partial<Image> = {
              uploadedBy: currentUser.uid,
              fileName: fileName,
              path: `${STORAGE_CONTAINER_UPLOAD_PATH}/${fileName}.jpeg`,
            };
            imageRepo
              .create(tempImage)
              .then((res) => {
                resolve(
                  download(STORAGE_CONTAINER_UPLOAD_PATH, `${fileName}.jpeg`, request, response)
                );
              })
              .catch((error: any) => {
                reject(new HttpErrors.InternalServerError(error.message));
              });
          });

          writableStream.on('error', function (error) {
            console.error('ERROR message', error);
            if (!errorAlreadyRejected) {
              errorAlreadyRejected = true;
              // it will send err file not found
              resolve(getFile(STORAGE_CONTAINER_UPLOAD_PATH, fileName)); // here we need to use await
            }
          });
          // pipe read and write stream with mixing sharp lib transform to save image to storage container
          pipeStreams([readableStream, transformer, writableStream])
            .then(function () {
              // all well, no errors in above stream creation
              return true;
            })
            .catch(function (error: any) {
              // in case of stream error send error 500
              console.log('**Exceptional Error**', error);
              if (!errorAlreadyRejected) {
                errorAlreadyRejected = true;
                return reject(new HttpErrors.InternalServerError(error.message));
              }
            });
        }
      });
    });
  }

  @authorize([RoleKey.All])
  @get('/images/{fileName}', {
    responses: {
      '200': {
        description: 'Download a File within specified Container',
        content: { 'application/json': { schema: { 'x-ts-type': Object } } },
      },
    },
  })
  async download(
    @param.path.string('fileName') fileName: string,
    @param.query.number('width') width: number,
    @param.query.number('height') height: number
  ): Promise<any> {
    //sharp after resize every time creates png file thus resize image will always be in png format
    const tempFileName = `${fileName}-${width}x${height}.jpeg`;
    const download = promisify(this.storageService.download);
    const imageRepo = this.imageRepository;
    const request = this.request;
    const response = this.response;
    const resizedPath = STORAGE_CONTAINER_RESIZED_PATH;
    async function isFileExists(tempPath: string) {
      const filterBuilder = new FilterBuilder<Image>();
      const filter = filterBuilder.where({ path: tempPath }).build();
      const image = await imageRepo.find(filter);
      if (image.length > 0) {
        return true;
      } else {
        return false;
      }
    }
    if (await isFileExists(`${resizedPath}/${tempFileName}`)) {
      return download(resizedPath, tempFileName, this.request, this.response);
    } else if (await isFileExists(`${STORAGE_CONTAINER_UPLOAD_PATH}/${fileName}.jpeg`)) {
      const transformer = sharp()
        .resize(width, height, {
          fit: 'fill', // this property use to fill the rectangle image (of given width and height)
        })
        .jpeg();
      // Read image data from readableStream, resize and write image data to writableStream
      await new Promise<object>((resolve, reject) => {
        const writableStream = this.storageService.uploadStream(resizedPath, tempFileName, config);
        let errorAlreadyRejected = false;
        writableStream.on('success', function (file) {
          const tempImage = {
            uploadedBy: '',
            fileName: fileName,
            path: `${resizedPath}/${tempFileName}`,
          };
          imageRepo
            .create(tempImage)
            .then((res: Image) => {
              console.log('uploaded image', res);
            })
            .catch((err: any) => {
              console.log('uploaded err', err);
            })
            .finally(() => {
              resolve(download(resizedPath, tempFileName, request, response));
            });
        });
        writableStream.on('error', function () {
          if (!errorAlreadyRejected) {
            errorAlreadyRejected = true;
            // it will send err file not found
            return reject(
              new HttpErrors.InternalServerError(
                `Not able to save the resize image to Storage Container`
              )
            );
          }
        });
        pipeStreams([
          this.storageService.downloadStream(
            STORAGE_CONTAINER_UPLOAD_PATH,
            `${fileName}.jpeg`,
            config
          ),
          transformer,
          writableStream,
        ])
          .then(function () {
            // all well, no errors in above stream
            return true;
          })
          .catch(function (err: any) {
            // in case of stream error send error 500
            console.log('**Exceptional Error**', err);
            if (!errorAlreadyRejected) {
              errorAlreadyRejected = true;
              return reject(new HttpErrors.InternalServerError(err.message));
            }
          });
      });
    } else {
      throw new HttpErrors.NotFound(`The Image [${fileName}] not found`);
    }
  }

  @authorize([RoleKey.Member, RoleKey.Merchant, RoleKey.Admin, RoleKey.SuperAdmin])
  @del('/images/{fileName}', {
    responses: {
      '200': {
        description: 'Booking model instance',
      },
    },
  })
  async deleteByName(@param.path.string('fileName') fileName: string): Promise<any> {
    const removeFile = promisify(this.storageService.removeFile);
    const imageRepo = this.imageRepository;
    const response = this.response;

    const currentUser: AllOptionalExceptFor<BoomUser, 'roles' | 'uid'> | undefined =
      await this.currentUserGetter();
    if (!currentUser) throw new HttpErrors.NotFound(ProfileResponseMessages.MEMBER_NOT_FOUND);

    const filterBuilder = new FilterBuilder<Image>();
    const filter = filterBuilder.where({ fileName }).order('uploadedBy DESC').build();
    const images = await imageRepo.find(filter);

    if (images.length && images[0].uploadedBy === currentUser.uid) {
      for (const image of images) {
        const filePath = image.path;
        const uploadedBy = image.uploadedBy;
        let tempFileName = '';
        let containerName = '';

        if (uploadedBy !== '') {
          tempFileName = filePath.replace(`${STORAGE_CONTAINER_UPLOAD_PATH}/`, '');
          containerName = STORAGE_CONTAINER_UPLOAD_PATH;
        } else {
          tempFileName = filePath.replace(`${STORAGE_CONTAINER_RESIZED_PATH}/`, '');
          containerName = STORAGE_CONTAINER_RESIZED_PATH;
        }
        await imageRepo.delete(image);
        await removeFile(containerName, tempFileName);
      }
      return response
        .status(ServiceResponseCodes.SUCCESS)
        .send({ success: true, message: `${fileName} deleted successfully` });
    } else if (images.length) {
      throw new HttpErrors.Unauthorized('You do not have the rights to remove this image');
    } else {
      throw new HttpErrors.NotFound('Image not found');
    }
  }
}
