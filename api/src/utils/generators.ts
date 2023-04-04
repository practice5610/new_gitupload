import { AllOptionalExceptFor, BoomUser, toMoney } from '@boom-platform/globals';

import AppError from '../errors/app-error';
import { Category, Product, Store } from '../models';
import { XMLSourceProduct } from '../types/sources';
const Entities = require('html-entities').AllHtmlEntities;
const entities = new Entities();

// @ts-ignore
export const generateProduct = (
  product: XMLSourceProduct,
  user: AllOptionalExceptFor<BoomUser, 'uid' | 'store' | 'firstName' | 'lastName'>
): Product => {
  let tempPrice: string = product.price;

  if (!user.store?._geoloc)
    throw new AppError(
      'User MUST have a store geolocation or the product will NOT be found in Search Engine',
      'User MUST have a store geolocation or the product will NOT be found in Search Engine',
      user
    );

  if (product.price.toString().indexOf('.') === -1) {
    tempPrice = `${product.price.toString()}.00`;
  }

  const amount = toMoney(tempPrice);
  const categoriesDecoded = entities.decode(product.categories);
  const categoriesArray = categoriesDecoded.split('||');
  const mainCategory = categoriesArray[0];
  const subCategory = categoriesArray[1];

  //TODO: Review this output to remove all @ts-ignore lines
  // @ts-ignore
  return {
    // @ts-ignore
    attributes: {
      // @ts-ignore
      upc: product.upc,

      // @ts-ignore
      product_id: product.product_id,

      // @ts-ignore
      item_id: product.item_id,
      // @ts-ignore
      stock: product.stock,
      // @ts-ignore
      supplier_id: product.supplier_id,
      // @ts-ignore
      supplier_name: product.supplier_name,
      // @ts-ignore
      brand_name: product.brand_name,
      // @ts-ignore
      item_sku: product.item_sku,
      // @ts-ignore
      ship_weight: product.ship_weight,
      // @ts-ignore
      warranty: product.warranty,
    },
    category: { name: mainCategory, subCategories: [subCategory] } as Category,
    // @ts-ignore
    imageUrl: product.image_file || product.additional_images,
    // @ts-ignore
    name: product.item_name || product.title,
    // @ts-ignore
    merchantUID: user.uid,
    price: amount,
    // @ts-ignore
    description: product.description,
    // @ts-ignore
    _tags: [],
    // @ts-ignore
    store: {
      _id: user.store._id,
      companyName: user.store.companyName,
      number: user.store.number, // TODO: Review if this change to address is correct - AddressInfo
      street1: user.store.street1,
      street2: user.store.street2,
      _geoloc: user.store._geoloc,
      merchant: {
        uid: user.uid,
        firstName: user.firstName,
        lastName: user.lastName,
      },
    } as Store,
  } as Product;
};
