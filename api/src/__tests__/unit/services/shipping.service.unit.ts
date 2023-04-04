import {
  DistanceUnit,
  MassUnit,
  PackageDetails,
  ShipmentMethod,
  toMoney,
} from '@boom-platform/globals';
import { createStubInstance, expect, StubbedInstanceWithSinonAccessor } from '@loopback/testlab';
import { nanoid } from 'nanoid';
import sinon from 'sinon';

import { Booking, Offer, Product, ShippingPolicy } from '../../../models';
import {
  ShippingBoxRepository,
  ShippingOrderRepository,
  ShippingPolicyRepository,
} from '../../../repositories';
import { ShippingService } from '../../../services';
import { Groups, MerchantTotals, ParcelGroups, ShippingPolicyList, Weight } from '../../../types';
import {
  givenBookings,
  givenEmptyDatabase,
  givenMoney,
  givenOffer,
  givenOfferBooking,
  givenPackageDetails,
  givenProduct,
  givenProductBooking,
  givenShippingBox,
  givenShippingPolicy,
  givenStore,
} from '../../helpers/database.helpers';

describe('Shipping Service (unit)', () => {
  let shippingOrderRepository: StubbedInstanceWithSinonAccessor<ShippingOrderRepository>;
  let shippingPolicyRepository: StubbedInstanceWithSinonAccessor<ShippingPolicyRepository>;
  let shippingBoxRepository: StubbedInstanceWithSinonAccessor<ShippingBoxRepository>;

  // these are the default methods hard coded in the service right now
  const defaultShipmentMethods = [ShipmentMethod.UPS_GROUND, ShipmentMethod.UPS_NEXT_DAY_AIR_SAVER];

  beforeEach(givenEmptyDatabase);
  beforeEach(givenShippingOrderRepository);
  beforeEach(givenShippingBoxRepository);
  beforeEach(givenShippingPolicyRepository);

  describe('validateAddress Tests', () => {});
  describe('getRates Tests', () => {});
  describe('getRate Tests', () => {});
  describe('purchase Tests', () => {});
  describe('getTransaction Tests', () => {});
  describe('getLabels Tests', () => {});
  describe('refund Tests', () => {});
  describe('optimizeCart Tests', () => {
    describe('getProduct Tests', () => {
      it('returns the product from an Offer Booking', async () => {
        const product: Product = await givenProduct();
        const offer: Offer = await givenOffer({ product: product });
        const booking: Booking = await givenOfferBooking({ item: offer });

        const response: Product = ShippingService.prototype.getProduct(booking);

        /**
         * response and product are deconstructed here to get rid of their prototypes
         * for some reason deep equal never works because our database helpers destroy
         * the prototypes of the data passed to them
         */
        expect({ ...response }).to.deepEqual(
          { ...product },
          'true if getProduct returns the product from a booking'
        );
      });
      it('returns the product from a non offer Booking', async () => {
        const product: Product = await givenProduct();
        const booking: Booking = await givenProductBooking({ item: product });

        const response: Product = ShippingService.prototype.getProduct(booking);

        /**
         * response and product are deconstructed here to get rid of their prototypes
         * for some reason deep equal never works because our database helpers destroy
         * the prototypes of the data passed to them
         */
        expect({ ...response }).to.deepEqual(
          { ...product },
          'true if getProduct returns the product from a booking'
        );
      });
    });
    describe('addMerchantTotals Tests', () => {
      it('creates an accurate list of totals spent at each merchant', async () => {
        const product: Product = await givenProduct({ price: givenMoney(10) });
        const product2: Product = { ...product, merchantUID: nanoid() } as Product;

        //pass 4 bookings
        const bookings: Booking[] = await givenBookings([
          { quantity: 1 },
          { quantity: 1 },
          { quantity: 5 },
          { quantity: 1 },
        ]);

        //Make the first, second, and fourth booking be from the same merchant
        // make the third booking be from a different merchant
        const getProductStub = sinon.stub(ShippingService.prototype, 'getProduct');
        getProductStub.returns(product);
        getProductStub.onThirdCall().returns(product2);

        const totals: MerchantTotals = ShippingService.prototype.addMerchantTotals(bookings);
        getProductStub.restore();

        // merchant 1 should have 3 $10 products and merchant 2 should have 1 booking with 5 $10 products
        expect(totals[product.merchantUID]).to.deepEqual(toMoney(30));
        expect(totals[product2.merchantUID]).to.deepEqual(toMoney(50));

        // totals should only have 2 keys
        expect(Object.keys(totals).length).to.eql(2);
      });
    });
    describe('getBookingWeight Tests', () => {
      it('returns zero weight if product is missing packageDetails', async () => {
        const product: Product = await givenProduct();
        delete product.packageDetails;
        const booking: Booking = (await givenBookings([{ quantity: 1 }]))[0];

        const getProductStub = sinon.stub(ShippingService.prototype, 'getProduct');
        getProductStub.returns(product);

        const weight: Weight = ShippingService.prototype.getBookingWeight(booking);
        getProductStub.restore();

        const zeroWeight: Weight = {
          value: 0,
          unit: MassUnit.GRAM,
        };

        expect(weight).to.deepEqual(
          zeroWeight,
          'true if function returns zero weight when packageDetails are missing'
        );
      });
      it('returns weight of 1 product if quantity is missing', async () => {
        const product: Product = await givenProduct();
        const booking: Booking = (await givenBookings([{ quantity: 1 }]))[0];

        const getProductStub = sinon.stub(ShippingService.prototype, 'getProduct');
        getProductStub.returns(product);

        const weight: Weight = ShippingService.prototype.getBookingWeight(booking);
        getProductStub.restore();

        // to avoid lint errors using ! we set this weight to a value that won't pass the expect if
        // one of the optional values is missing
        const targetWeight: Weight = {
          value: product.packageDetails?.weight ?? -1,
          unit: product.packageDetails?.massUnit ?? MassUnit.POUND,
        };

        expect(weight).to.deepEqual(
          targetWeight,
          'true if function returns weight of 1 product when quantity is missing'
        );
      });
      it('returns zero weight when qty = 0', async () => {
        const product: Product = await givenProduct();
        const booking: Booking = (await givenBookings([{ quantity: 0 }]))[0];

        const getProductStub = sinon.stub(ShippingService.prototype, 'getProduct');
        getProductStub.returns(product);

        const weight: Weight = ShippingService.prototype.getBookingWeight(booking);
        getProductStub.restore();

        const zeroWeight: Weight = {
          value: 0,
          unit: MassUnit.GRAM,
        };

        expect(weight).to.deepEqual(
          zeroWeight,
          'true if function returns zero weight when quantity = 0'
        );
      });
      it('returns correct weight when quantity = 1', async () => {
        const product: Product = await givenProduct();
        const booking: Booking = (await givenBookings([{ quantity: 1 }]))[0];

        const getProductStub = sinon.stub(ShippingService.prototype, 'getProduct');
        getProductStub.returns(product);

        const weight: Weight = ShippingService.prototype.getBookingWeight(booking);
        getProductStub.restore();

        // to avoid lint errors using ! we set this weight to a value that won't pass the expect if
        // one of the optional values is missing
        const realWeight: Weight = {
          value: product.packageDetails?.weight ?? -1,
          unit: product.packageDetails?.massUnit ?? MassUnit.POUND,
        };

        expect(weight).to.deepEqual(
          realWeight,
          'true if function returns weight of product from booking'
        );
      });
      it('returns correct weight when quantity > 1', async () => {
        const product: Product = await givenProduct();
        const booking: Booking = (await givenBookings([{ quantity: 3 }]))[0];

        const getProductStub = sinon.stub(ShippingService.prototype, 'getProduct');
        getProductStub.returns(product);

        const weight: Weight = ShippingService.prototype.getBookingWeight(booking);
        getProductStub.restore();

        // to avoid lint errors using ! we set this weight to a value that won't pass the expect if
        // one of the optional values is missing
        const realWeight: Weight = {
          value: (product.packageDetails?.weight ?? 0) * 3,
          unit: product.packageDetails?.massUnit ?? MassUnit.POUND,
        };

        expect(weight).to.deepEqual(
          realWeight,
          'true if function returns weight of products from booking'
        );
      });
    });
    describe('addWeights Tests', () => {
      it('returns correct sum of 2 weights with same mass unit', async () => {
        const oneLB: Weight = { value: 1, unit: MassUnit.POUND };
        const fourLB: Weight = { value: 4, unit: MassUnit.POUND };

        const fiveLB: Weight = ShippingService.prototype.addWeights(oneLB, fourLB);

        expect(fiveLB).to.deepEqual(
          { value: 5, unit: MassUnit.POUND },
          'true if 1LB + 4LB returned 5LB'
        );
      });
      it('returns correct sum in grams of 2 weights with different mass units', async () => {
        const fiveG: Weight = { value: 5, unit: MassUnit.GRAM };
        const oneK: Weight = { value: 1, unit: MassUnit.KILO };
        const threeLB: Weight = { value: 3, unit: MassUnit.POUND };
        const nineOZ: Weight = { value: 9, unit: MassUnit.OUNCE };

        const oz_lb = ShippingService.prototype.addWeights(nineOZ, threeLB);
        const oz_g = ShippingService.prototype.addWeights(nineOZ, fiveG);
        const oz_k = ShippingService.prototype.addWeights(nineOZ, oneK);
        const g_lb = ShippingService.prototype.addWeights(fiveG, threeLB);
        const g_k = ShippingService.prototype.addWeights(fiveG, oneK);
        const lb_k = ShippingService.prototype.addWeights(threeLB, oneK);

        expect(oz_lb.unit)
          .eql(oz_g.unit)
          .eql(oz_k.unit)
          .eql(g_lb.unit)
          .eql(g_k.unit)
          .eql(lb_k.unit)
          .eql(MassUnit.GRAM, 'true if all weight results are in grams');
        expect(Math.floor(oz_lb.value)).to.eql(1615, 'true if oz->g and lb->g work');
        expect(Math.floor(oz_g.value)).to.eql(260, 'true if oz->g and g->g work');
        expect(Math.floor(oz_k.value)).to.eql(1255, 'true if oz->g and k->g work');
        expect(Math.floor(g_lb.value)).to.eql(1365, 'true if g->g and lb->g work');
        expect(Math.floor(g_k.value)).to.eql(1005, 'true if g->g and k->g work');
        expect(Math.floor(lb_k.value)).to.eql(2360, 'true if lb->g and k->g work');
      });
      it("returns sum in non-zero weight's units if one input is zero", async () => {
        const threeLB: Weight = { value: 3, unit: MassUnit.POUND };
        const zeroG: Weight = { value: 0, unit: MassUnit.GRAM };

        expect(ShippingService.prototype.addWeights(threeLB, zeroG))
          .deepEqual(ShippingService.prototype.addWeights(zeroG, threeLB))
          .deepEqual(threeLB);
      });
      it('returns the defined input if one input is undefined', async () => {
        const sixK: Weight = { value: 6, unit: MassUnit.KILO };

        //@ts-ignore
        const result1: Weight = ShippingService.prototype.addWeights(sixK, undefined);
        //@ts-ignore
        const result2: Weight = ShippingService.prototype.addWeights(undefined, sixK);

        expect(result1).deepEqual(result2).deepEqual(sixK);
      });
    });
    describe('chooseShipmentMethods Tests', () => {
      it('returns default shipment methods if there is no free shipping offered', async () => {
        const policy = await givenShippingPolicy();
        const moneyTotals: MerchantTotals = {};
        moneyTotals[policy.merchantId] = toMoney(50);

        const methods = ShippingService.prototype.chooseShipmentMethods(moneyTotals, policy);

        expect(methods).deepEqual(
          defaultShipmentMethods,
          'true if chooseShipmentMethods did not add any additional methods'
        );
      });
      it('returns default methods if free shipping threshold not met', async () => {
        const policy = await givenShippingPolicy({
          freeShippingThresholds: [
            { amountSpent: toMoney(100), freeService: ShipmentMethod.USPS_PRIORITY },
          ],
        });
        const moneyTotals: MerchantTotals = {};
        moneyTotals[policy.merchantId] = toMoney(50);

        const methods = ShippingService.prototype.chooseShipmentMethods(moneyTotals, policy);

        expect(methods).deepEqual(
          defaultShipmentMethods,
          'true if chooseShipmentMethods did not add any additional methods'
        );
      });
      it('returns default methods + free method if free shipping threshold is met', async () => {
        const policy = await givenShippingPolicy({
          freeShippingThresholds: [
            { amountSpent: toMoney(100), freeService: ShipmentMethod.USPS_PRIORITY },
          ],
        });
        const moneyTotals: MerchantTotals = {};
        moneyTotals[policy.merchantId] = toMoney(100);

        const shipmentMethods = [...defaultShipmentMethods, ShipmentMethod.USPS_PRIORITY];

        const result = ShippingService.prototype.chooseShipmentMethods(moneyTotals, policy);

        expect(result).deepEqual(
          shipmentMethods,
          'true if chooseShipmentMethods added the correct shipmentMethod'
        );
      });
      it('does not return duplicate shipping methods when duplicate free methods are added', async () => {
        const policy = await givenShippingPolicy({
          freeShippingThresholds: [
            { amountSpent: toMoney(100), freeService: defaultShipmentMethods[0] },
          ],
        });
        const moneyTotals: MerchantTotals = {};
        moneyTotals[policy.merchantId] = toMoney(100);

        const result = ShippingService.prototype.chooseShipmentMethods(moneyTotals, policy);

        expect(result).deepEqual(
          defaultShipmentMethods,
          'true if chooseShipmentMethods did not return duplicate methods'
        );
      });
    });
    describe('groupBookings Tests', () => {
      /**
       * groups (unique combo of shipping policy & shipsFrom address)
       *    -> list of boxGroups (all bookings in the group split by what box they belong in)
       */
      describe('grouping when all bookings are shippable', () => {
        it('groups successfully with one from location with several shipping policies', async () => {
          // 2 policies
          const policy1: ShippingPolicy = await givenShippingPolicy();
          const policy2: ShippingPolicy = await givenShippingPolicy({
            merchantId: policy1.merchantId,
          });
          const policyList: ShippingPolicyList = {};

          // We can't use ! on _id because of lint so we use this null check to set a value that will make the
          // test fail if _id doesn't exist
          policyList[policy1._id ?? ''] = policy1;
          policyList[policy2._id ?? ''] = policy2;

          // 2 different boxes shipping with same policy from same location
          const packageDetails1: PackageDetails = givenPackageDetails();
          const packageDetails2: PackageDetails = givenPackageDetails({
            shipsFrom: packageDetails1.shipsFrom,
          });
          // 1 box type shipping with 2nd policy, but shipping from same location
          const packageDetails3: PackageDetails = givenPackageDetails({
            shipsFrom: packageDetails1.shipsFrom,
          });

          const prod1: Product = await givenProduct({
            shippingPolicy: policy1._id,
            packageDetails: packageDetails1,
          });
          const prod2: Product = await givenProduct({
            shippingPolicy: policy1._id,
            packageDetails: packageDetails2,
          });
          const prod3: Product = await givenProduct({
            shippingPolicy: policy2._id,
            packageDetails: packageDetails3,
          });

          // b1 and b2 have same shipping policy, diffent boxes, from same location
          const b1: Booking = await givenProductBooking({ item: prod1, quantity: 1 });
          const b2: Booking = await givenOfferBooking({
            item: await givenOffer({ product: prod2 }),
            quantity: 1,
          });
          // b3 & b4 have same shipping policy, same box, and same location as b1&b2
          const b3: Booking = await givenProductBooking({ item: prod3, quantity: 1 });
          const b4: Booking = await givenOfferBooking({
            item: await givenOffer({ product: prod3 }),
            quantity: 1,
          });

          const bookings: Booking[] = [b1, b2, b3, b4];

          const service = new ShippingService(
            shippingOrderRepository,
            shippingPolicyRepository,
            shippingBoxRepository
          );

          shippingBoxRepository.stubs.findById
            .onFirstCall()
            .resolves(await givenShippingBox({ _id: packageDetails1.boxId }));
          shippingBoxRepository.stubs.findById
            .onSecondCall()
            .resolves(await givenShippingBox({ _id: packageDetails2.boxId }));
          shippingBoxRepository.stubs.findById
            .onThirdCall()
            .resolves(await givenShippingBox({ _id: packageDetails3.boxId }));

          const { groupedBookings, pickUpOrders, failedBookings } = await service.groupBookings(
            bookings,
            policyList
          );

          const group1 = groupedBookings[packageDetails1.shipsFrom + policy1._id];
          const group2 = groupedBookings[packageDetails3.shipsFrom + policy2._id];

          expect(pickUpOrders.length)
            .to.eql(failedBookings.length)
            .to.eql(0, 'there should be no pick up orders or failed bookings');
          expect(Object.keys(groupedBookings).length).to.eql(
            2,
            'There should be 2 groups in this order'
          );
          expect(Object.keys(group1)).to.deepEqual(
            [packageDetails1.boxId, packageDetails2.boxId],
            'group 1 has these 2 exact box groups'
          );
          expect(Object.keys(group2)).to.deepEqual(
            [packageDetails3.boxId],
            'group 2 has this 1 exact box group'
          );
          expect(
            group1[packageDetails1.boxId].items.map((i) => {
              return i.booking;
            })
          ).deepEqual([b1], 'exactly this one booking belongs in this box group');
          expect(
            group1[packageDetails2.boxId].items.map((i) => {
              return i.booking;
            })
          ).deepEqual([b2], 'exactly this one booking belongs in this box group');
          expect(
            group2[packageDetails3.boxId].items.map((i) => {
              return i.booking;
            })
          ).deepEqual([b3, b4], 'exactly these two bookings belong in this box group');
        });
        it('groups successfully with one from location with one shipping policy', async () => {
          // 1 policy
          const policy1: ShippingPolicy = await givenShippingPolicy();
          const policyList: ShippingPolicyList = {};

          // We can't use ! on _id because of lint so we use this null check to set a value that will make the
          // test fail if _id doesn't exist
          policyList[policy1._id ?? ''] = policy1;

          // only 1 box shipping with same policy from same location
          const packageDetails1: PackageDetails = givenPackageDetails();

          const prod1: Product = await givenProduct({
            shippingPolicy: policy1._id,
            packageDetails: packageDetails1,
          });
          const prod2: Product = await givenProduct({
            shippingPolicy: policy1._id,
            packageDetails: packageDetails1,
          });
          const prod3: Product = await givenProduct({
            shippingPolicy: policy1._id,
            packageDetails: packageDetails1,
          });

          // b1, b2, b3 have same shipping policy, same boxes, from same location
          const b1: Booking = await givenProductBooking({ item: prod1, quantity: 1 });
          const b2: Booking = await givenOfferBooking({
            item: await givenOffer({ product: prod2 }),
            quantity: 1,
          });
          // b3 & b4 have same shipping policy, same box, and same location as b1&b2
          const b3: Booking = await givenProductBooking({ item: prod3, quantity: 1 });

          const bookings: Booking[] = [b1, b2, b3];

          const service = new ShippingService(
            shippingOrderRepository,
            shippingPolicyRepository,
            shippingBoxRepository
          );

          shippingBoxRepository.stubs.findById.resolves(
            await givenShippingBox({ _id: packageDetails1.boxId })
          );

          const { groupedBookings, pickUpOrders, failedBookings } = await service.groupBookings(
            bookings,
            policyList
          );

          const group1 = groupedBookings[packageDetails1.shipsFrom + policy1._id];

          expect(pickUpOrders.length)
            .to.eql(failedBookings.length)
            .to.eql(0, 'there should be no pick up orders or failed bookings');
          expect(Object.keys(groupedBookings).length).to.eql(
            1,
            'There should be 1 group in this order'
          );
          expect(Object.keys(group1)).to.deepEqual(
            [packageDetails1.boxId],
            'group 1 has this 1 exact box group'
          );
          expect(
            group1[packageDetails1.boxId].items.map((i) => {
              return i.booking;
            })
          ).deepEqual([b1, b2, b3], 'exactly these 3 bookings belongs in this box group');
        });
        it('groups successfully with several from locations', async () => {
          // 2 policies
          const policy1: ShippingPolicy = await givenShippingPolicy();
          const policy2: ShippingPolicy = await givenShippingPolicy();
          const policy3: ShippingPolicy = await givenShippingPolicy();
          const policyList: ShippingPolicyList = {};

          // We can't use ! on _id because of lint so we use this null check to set a value that will make the
          // test fail if _id doesn't exist
          policyList[policy1._id ?? ''] = policy1;
          policyList[policy2._id ?? ''] = policy2;
          policyList[policy3._id ?? ''] = policy3;

          // 3 different boxes shipping from different locations
          const packageDetails1: PackageDetails = givenPackageDetails();
          const packageDetails2: PackageDetails = givenPackageDetails();
          const packageDetails3: PackageDetails = givenPackageDetails();

          const prod1: Product = await givenProduct({
            shippingPolicy: policy1._id,
            packageDetails: packageDetails1,
          });
          const prod2: Product = await givenProduct({
            shippingPolicy: policy2._id,
            packageDetails: packageDetails2,
          });
          const prod3: Product = await givenProduct({
            shippingPolicy: policy3._id,
            packageDetails: packageDetails3,
          });

          // b1 and b2 and b3 have different shipping policy, diffent boxes, from different location
          const b1: Booking = await givenProductBooking({ item: prod1, quantity: 1 });
          const b2: Booking = await givenOfferBooking({
            item: await givenOffer({ product: prod2 }),
            quantity: 1,
          });
          const b3: Booking = await givenProductBooking({ item: prod3, quantity: 1 });
          const b4: Booking = await givenOfferBooking({
            item: await givenOffer({ product: prod3 }),
            quantity: 1,
          });

          const bookings: Booking[] = [b1, b2, b3, b4];

          const service = new ShippingService(
            shippingOrderRepository,
            shippingPolicyRepository,
            shippingBoxRepository
          );

          shippingBoxRepository.stubs.findById
            .onFirstCall()
            .resolves(await givenShippingBox({ _id: packageDetails1.boxId }));
          shippingBoxRepository.stubs.findById
            .onSecondCall()
            .resolves(await givenShippingBox({ _id: packageDetails2.boxId }));
          shippingBoxRepository.stubs.findById
            .onThirdCall()
            .resolves(await givenShippingBox({ _id: packageDetails3.boxId }));

          const { groupedBookings, pickUpOrders, failedBookings } = await service.groupBookings(
            bookings,
            policyList
          );

          const group1 = groupedBookings[packageDetails1.shipsFrom + policy1._id];
          const group2 = groupedBookings[packageDetails2.shipsFrom + policy2._id];
          const group3 = groupedBookings[packageDetails3.shipsFrom + policy3._id];

          expect(pickUpOrders.length)
            .to.eql(failedBookings.length)
            .to.eql(0, 'there should be no pick up orders or failed bookings');
          expect(Object.keys(groupedBookings).length).to.eql(
            3,
            'There should be 3 groups in this order'
          );
          expect(Object.keys(group1)).to.deepEqual(
            [packageDetails1.boxId],
            'group 1 has this 1 exact box group'
          );
          expect(Object.keys(group2)).to.deepEqual(
            [packageDetails2.boxId],
            'group 2 has this 1 exact box group'
          );
          expect(Object.keys(group3)).to.deepEqual(
            [packageDetails3.boxId],
            'group 3 has this 1 exact box group'
          );
          expect(
            group1[packageDetails1.boxId].items.map((i) => {
              return i.booking;
            })
          ).deepEqual([b1], 'exactly this one booking belongs in this box group');
          expect(
            group2[packageDetails2.boxId].items.map((i) => {
              return i.booking;
            })
          ).deepEqual([b2], 'exactly this one booking belongs in this box group');
          expect(
            group3[packageDetails3.boxId].items.map((i) => {
              return i.booking;
            })
          ).deepEqual([b3, b4], 'exactly these two bookings belongs in this box group');
        });
      });
      it('boxfill is calculated correctly', async () => {
        // 1 policy
        const policy1: ShippingPolicy = await givenShippingPolicy();
        const policyList: ShippingPolicyList = {};

        // We can't use ! on _id because of lint so we use this null check to set a value that will make the
        // test fail if _id doesn't exist
        policyList[policy1._id ?? ''] = policy1;

        // 1 product takes 10% of the box
        const packageDetails1: PackageDetails = givenPackageDetails({ itemsPerBox: 10 });

        const prod1: Product = await givenProduct({
          shippingPolicy: policy1._id,
          packageDetails: packageDetails1,
        });

        // b1 takes up 80% of a box
        const b1: Booking = await givenProductBooking({ item: prod1, quantity: 8 });

        const bookings: Booking[] = [b1];

        const service = new ShippingService(
          shippingOrderRepository,
          shippingPolicyRepository,
          shippingBoxRepository
        );

        shippingBoxRepository.stubs.findById.resolves(
          await givenShippingBox({ _id: packageDetails1.boxId })
        );

        const { groupedBookings } = await service.groupBookings(bookings, policyList);

        const boxGroup =
          groupedBookings[packageDetails1.shipsFrom + policy1._id][packageDetails1.boxId];

        expect(boxGroup.items.length).eql(1);
        expect(boxGroup.items[0].boxFill).eql(0.8);
      });
      it('groups pick-up orders successfully', async () => {
        // 2 policies
        const policy1: ShippingPolicy = await givenShippingPolicy({ pickUpOnly: true });
        const policy2: ShippingPolicy = await givenShippingPolicy({ pickUpOnly: true });
        const policyList: ShippingPolicyList = {};

        // We can't use ! on _id because of lint so we use this null check to set a value that will make the
        // test fail if _id doesn't exist
        policyList[policy1._id ?? ''] = policy1;
        policyList[policy2._id ?? ''] = policy2;

        const prod1: Product = await givenProduct({
          shippingPolicy: policy1._id,
          packageDetails: undefined,
        });
        const prod2: Product = await givenProduct({
          shippingPolicy: policy2._id,
          packageDetails: undefined,
        });
        const prod3: Product = await givenProduct({
          shippingPolicy: policy2._id,
          packageDetails: undefined,
        });

        // b1 is pick up only from 1 location
        const b1: Booking = await givenProductBooking({ item: prod1, quantity: 1 });
        // b2 & b3 are pick up only from second location
        const b2: Booking = await givenOfferBooking({
          item: await givenOffer({ product: prod2 }),
          quantity: 1,
        });
        const b3: Booking = await givenProductBooking({ item: prod3, quantity: 1 });

        const bookings: Booking[] = [b1, b2, b3];

        const service = new ShippingService(
          shippingOrderRepository,
          shippingPolicyRepository,
          shippingBoxRepository
        );

        const { groupedBookings, pickUpOrders, failedBookings } = await service.groupBookings(
          bookings,
          policyList
        );

        expect(failedBookings.length).to.eql(0, 'there should be no failed bookings');
        expect(pickUpOrders.length).to.eql(2, 'there should be 2 pick up orders');
        expect(Object.keys(groupedBookings).length).to.eql(
          0,
          'There should be 0 groupedBookings in this order'
        );
        expect(pickUpOrders[0]).to.deepEqual({
          store: prod1.store.companyName,
          bookings: [b1],
          shippable: false,
          rates: [],
        });
        expect(pickUpOrders[1]).to.deepEqual({
          store: prod2.store.companyName,
          bookings: [b2, b3],
          shippable: false,
          rates: [],
        });
      });
    });
    describe('createParcelGroups Tests', () => {
      it('bookings are correctly placed in parcel groups', async () => {
        // 2 policies
        const policy1: ShippingPolicy = await givenShippingPolicy();
        const policy2: ShippingPolicy = await givenShippingPolicy();
        const policyList: ShippingPolicyList = {};

        // We can't use ! on _id because of lint so we use this null check to set a value that will make the
        // test fail if _id doesn't exist
        policyList[policy1._id ?? ''] = policy1;
        policyList[policy2._id ?? ''] = policy2;

        // 2 boxes for policy 1
        const packageDetails1: PackageDetails = givenPackageDetails();
        const packageDetails2: PackageDetails = givenPackageDetails();
        // 1 box for policy 2
        const packageDetails3: PackageDetails = givenPackageDetails();

        // 2 products for package 1 (policy 1)
        const prod1: Product = await givenProduct({
          shippingPolicy: policy1._id,
          packageDetails: packageDetails1,
        });
        const prod2: Product = await givenProduct({
          shippingPolicy: policy1._id,
          packageDetails: packageDetails1,
        });
        //1 product for package 2 (policy 1)
        const prod3: Product = await givenProduct({
          shippingPolicy: policy1._id,
          packageDetails: packageDetails2,
        });
        // 1 product for package 3 (policy 2)
        const prod4: Product = await givenProduct({
          shippingPolicy: policy2._id,
          packageDetails: packageDetails3,
        });

        const b1: Booking = await givenProductBooking({ item: prod1, quantity: 1 });
        const b2: Booking = await givenProductBooking({ item: prod2, quantity: 1 });
        const b3: Booking = await givenProductBooking({ item: prod3, quantity: 1 });
        const b4: Booking = await givenProductBooking({ item: prod4, quantity: 1 });

        const groups: Groups = {
          group1: {
            boxGroup1: {
              items: [
                { booking: b1, boxFill: 0.2, weight: { value: 5, unit: MassUnit.GRAM } },
                { booking: b2, boxFill: 0.7, weight: { value: 1, unit: MassUnit.GRAM } },
              ],
              distanceUnit: DistanceUnit.CENTIMETER,
              length: 5,
              width: 5,
              height: 5,
            },
            boxGroup2: {
              items: [{ booking: b3, boxFill: 0.5, weight: { value: 20, unit: MassUnit.GRAM } }],
              distanceUnit: DistanceUnit.CENTIMETER,
              length: 10,
              width: 8,
              height: 5,
            },
          },
          group2: {
            boxGroup2: {
              items: [{ booking: b4, boxFill: 0.1, weight: { value: 6, unit: MassUnit.POUND } }],
              distanceUnit: DistanceUnit.INCH,
              length: 10,
              width: 8,
              height: 5,
            },
          },
        };

        const stubAddWeights = sinon.stub(ShippingService.prototype, 'addWeights');
        stubAddWeights.returns({ value: 50, unit: MassUnit.GRAM });
        const parcelGroups = ShippingService.prototype.createParcelGroups(groups, policyList);
        stubAddWeights.restore();
        expect(parcelGroups).to.deepEqual([
          {
            parcels: [
              {
                bookings: [b2, b1],
                weight: 50,
                weightUnit: MassUnit.GRAM,
                distanceUnit: DistanceUnit.CENTIMETER,
                width: 5,
                height: 5,
                length: 5,
              },
              {
                bookings: [b3],
                weight: 50,
                weightUnit: MassUnit.GRAM,
                distanceUnit: DistanceUnit.CENTIMETER,
                width: 8,
                height: 5,
                length: 10,
              },
            ],
            policy: policy1,
          },
          {
            parcels: [
              {
                bookings: [b4],
                weight: 50,
                weightUnit: MassUnit.GRAM,
                distanceUnit: DistanceUnit.INCH,
                width: 8,
                height: 5,
                length: 10,
              },
            ],
            policy: policy2,
          },
        ]);
      });
      it('extra parcels are added when too many bookings for one box', async () => {
        // 1 policy
        const policy1: ShippingPolicy = await givenShippingPolicy();
        const policyList: ShippingPolicyList = {};

        // We can't use ! on _id because of lint so we use this null check to set a value that will make the
        // test fail if _id doesn't exist
        policyList[policy1._id ?? ''] = policy1;

        // 1 box
        const packageDetails1: PackageDetails = givenPackageDetails();

        const prod1: Product = await givenProduct({
          shippingPolicy: policy1._id,
          packageDetails: packageDetails1,
        });
        const prod2: Product = await givenProduct({
          shippingPolicy: policy1._id,
          packageDetails: packageDetails1,
        });
        const prod3: Product = await givenProduct({
          shippingPolicy: policy1._id,
          packageDetails: packageDetails1,
        });
        const prod4: Product = await givenProduct({
          shippingPolicy: policy1._id,
          packageDetails: packageDetails1,
        });

        const b1: Booking = await givenProductBooking({ item: prod1, quantity: 1 });
        const b2: Booking = await givenProductBooking({ item: prod2, quantity: 1 });
        const b3: Booking = await givenProductBooking({ item: prod3, quantity: 1 });
        const b4: Booking = await givenProductBooking({ item: prod4, quantity: 1 });

        const groups: Groups = {
          group1: {
            boxGroup1: {
              items: [
                { booking: b1, boxFill: 0.4, weight: { value: 50, unit: MassUnit.GRAM } },
                { booking: b2, boxFill: 0.7, weight: { value: 50, unit: MassUnit.GRAM } },
                { booking: b3, boxFill: 0.5, weight: { value: 50, unit: MassUnit.GRAM } },
                { booking: b4, boxFill: 0.45, weight: { value: 50, unit: MassUnit.GRAM } },
              ],
              distanceUnit: DistanceUnit.CENTIMETER,
              length: 5,
              width: 5,
              height: 5,
            },
          },
        };

        const stubAddWeights = sinon.stub(ShippingService.prototype, 'addWeights');
        stubAddWeights.returns({ value: 50, unit: MassUnit.GRAM });
        const parcelGroups = ShippingService.prototype.createParcelGroups(groups, policyList);
        stubAddWeights.restore();
        expect(parcelGroups).to.deepEqual([
          {
            parcels: [
              {
                bookings: [b2],
                weight: 50,
                weightUnit: MassUnit.GRAM,
                distanceUnit: DistanceUnit.CENTIMETER,
                width: 5,
                height: 5,
                length: 5,
              },
              {
                bookings: [b3, b4],
                weight: 50,
                weightUnit: MassUnit.GRAM,
                distanceUnit: DistanceUnit.CENTIMETER,
                width: 5,
                height: 5,
                length: 5,
              },
              {
                bookings: [b1],
                weight: 50,
                weightUnit: MassUnit.GRAM,
                distanceUnit: DistanceUnit.CENTIMETER,
                width: 5,
                height: 5,
                length: 5,
              },
            ],
            policy: policy1,
          },
        ]);
      });
      it('addWeights is getting called correctly', async () => {
        // 1 policy
        const policy1: ShippingPolicy = await givenShippingPolicy();
        const policyList: ShippingPolicyList = {};

        // We can't use ! on _id because of lint so we use this null check to set a value that will make the
        // test fail if _id doesn't exist
        policyList[policy1._id ?? ''] = policy1;

        // 1 box
        const packageDetails1: PackageDetails = givenPackageDetails();

        const prod1: Product = await givenProduct({
          shippingPolicy: policy1._id,
          packageDetails: packageDetails1,
        });
        const prod2: Product = await givenProduct({
          shippingPolicy: policy1._id,
          packageDetails: packageDetails1,
        });
        const prod3: Product = await givenProduct({
          shippingPolicy: policy1._id,
          packageDetails: packageDetails1,
        });
        const prod4: Product = await givenProduct({
          shippingPolicy: policy1._id,
          packageDetails: packageDetails1,
        });

        const b1: Booking = await givenProductBooking({ item: prod1, quantity: 1 });
        const b2: Booking = await givenProductBooking({ item: prod2, quantity: 1 });
        const b3: Booking = await givenProductBooking({ item: prod3, quantity: 1 });
        const b4: Booking = await givenProductBooking({ item: prod4, quantity: 1 });

        const groups: Groups = {
          group1: {
            boxGroup1: {
              items: [
                { booking: b1, boxFill: 0.1, weight: { value: 1, unit: MassUnit.GRAM } },
                { booking: b2, boxFill: 0.1, weight: { value: 2, unit: MassUnit.GRAM } },
                { booking: b3, boxFill: 0.1, weight: { value: 3, unit: MassUnit.GRAM } },
                { booking: b4, boxFill: 0.1, weight: { value: 4, unit: MassUnit.GRAM } },
              ],
              distanceUnit: DistanceUnit.CENTIMETER,
              length: 5,
              width: 5,
              height: 5,
            },
          },
        };

        const stubAddWeights = sinon.stub(ShippingService.prototype, 'addWeights');
        stubAddWeights.returns({ value: 1, unit: MassUnit.GRAM });
        ShippingService.prototype.createParcelGroups(groups, policyList);

        expect(stubAddWeights.args).deepEqual([
          [
            { value: 0, unit: MassUnit.GRAM },
            { value: 1, unit: MassUnit.GRAM },
          ],
          [
            { value: 1, unit: MassUnit.GRAM },
            { value: 2, unit: MassUnit.GRAM },
          ],
          [
            { value: 1, unit: MassUnit.GRAM },
            { value: 3, unit: MassUnit.GRAM },
          ],
          [
            { value: 1, unit: MassUnit.GRAM },
            { value: 4, unit: MassUnit.GRAM },
          ],
        ]);
        stubAddWeights.restore();
      });
    });
    describe('createOrderGroups Tests', () => {
      it('creates correct order groups', async () => {
        const merchantTotals = {} as MerchantTotals;
        const policy1 = await givenShippingPolicy();
        const store = await givenStore();
        const prod = await givenProduct({ store: store });
        const booking1 = await givenProductBooking({ item: prod });
        const booking2 = await givenProductBooking({ item: prod });
        const booking3 = await givenProductBooking();
        const parcelGroups: ParcelGroups[] = [
          {
            parcels: [
              {
                bookings: [booking1, booking2],
                weight: 5,
                weightUnit: MassUnit.KILO,
                distanceUnit: DistanceUnit.FEET,
                length: 3,
                width: 0.8,
                height: 1,
              },
              {
                bookings: [booking3],
                weight: 2,
                weightUnit: MassUnit.OUNCE,
                distanceUnit: DistanceUnit.CENTIMETER,
                length: 3,
                width: 10,
                height: 4,
              },
            ],
            policy: policy1,
          },
        ];
        const service = new ShippingService(
          shippingOrderRepository,
          shippingPolicyRepository,
          shippingBoxRepository
        );
        const stubGetRates = sinon.stub(service, 'getRates');
        const stubGetMethods = sinon.stub(service, 'chooseShipmentMethods');
        const rateData = {
          success: true,
          data: [
            {
              shippo_id: 'shippo_id',
              attributes: [],
              amount: toMoney(5),
              provider: 'Test Provider',
              service: 'Test Service',
              service_token: ShipmentMethod.USPS_FIRST,
              estimated_days: 5,
              duration_terms: 'test terms',
            },
          ],
          message: 'stubbed response',
        };
        stubGetRates.resolves(rateData);
        stubGetMethods.returns([]);
        const response = await service.createOrderGroups(
          merchantTotals,
          parcelGroups,
          'to_address'
        );

        expect(response).deepEqual([
          {
            store: store.companyName,
            rates: rateData.data,
            bookings: [booking1, booking2, booking3],
            shippable: true,
          },
        ]);

        stubGetRates.restore();
        stubGetMethods.restore();
      });
      it('creates correct order groups when group parcel rate fails', async () => {
        const merchantTotals = {} as MerchantTotals;
        const policy1 = await givenShippingPolicy();
        const store = await givenStore();
        const prod = await givenProduct({ store: store });
        const booking1 = await givenProductBooking({ item: prod });
        const booking2 = await givenProductBooking({ item: prod });
        const booking3 = await givenProductBooking();
        const parcelGroups: ParcelGroups[] = [
          {
            parcels: [
              {
                bookings: [booking1, booking2],
                weight: 5,
                weightUnit: MassUnit.KILO,
                distanceUnit: DistanceUnit.FEET,
                length: 3,
                width: 0.8,
                height: 1,
              },
              {
                bookings: [booking3],
                weight: 2,
                weightUnit: MassUnit.OUNCE,
                distanceUnit: DistanceUnit.CENTIMETER,
                length: 3,
                width: 10,
                height: 4,
              },
            ],
            policy: policy1,
          },
        ];
        const service = new ShippingService(
          shippingOrderRepository,
          shippingPolicyRepository,
          shippingBoxRepository
        );
        const stubGetRates = sinon.stub(service, 'getRates');
        const stubGetMethods = sinon.stub(service, 'chooseShipmentMethods');
        const rateData = {
          success: true,
          data: [
            {
              shippo_id: 'shippo_id',
              attributes: [],
              amount: toMoney(5),
              provider: 'Test Provider',
              service: 'Test Service',
              service_token: ShipmentMethod.USPS_FIRST,
              estimated_days: 5,
              duration_terms: 'test terms',
            },
          ],
          message: 'stubbed response',
        };
        stubGetRates.onFirstCall().resolves({ success: false, message: 'fail' });
        stubGetRates.resolves(rateData);
        stubGetMethods.returns([]);
        const response = await service.createOrderGroups(
          merchantTotals,
          parcelGroups,
          'to_address'
        );

        expect(response).deepEqual([
          {
            store: store.companyName,
            rates: rateData.data,
            bookings: [booking1, booking2],
            shippable: true,
          },
          {
            store: store.companyName,
            rates: rateData.data,
            bookings: [booking3],
            shippable: true,
          },
        ]);

        stubGetRates.restore();
        stubGetMethods.restore();
      });
    });
    describe('splitBookings Tests', () => {
      it('successfully splits bookings that can not fit in a box', async () => {
        const booking1 = await givenProductBooking({
          item: await givenProduct({ packageDetails: givenPackageDetails({ itemsPerBox: 2 }) }),
          quantity: 5,
        });
        const booking2 = await givenProductBooking({
          item: await givenProduct({ packageDetails: givenPackageDetails({ itemsPerBox: 5 }) }),
          quantity: 4,
        });
        const booking3 = await givenProductBooking({
          item: await givenProduct({ packageDetails: givenPackageDetails({ itemsPerBox: 1 }) }),
          quantity: 2,
        });

        const splitBookings = ShippingService.prototype.splitBookings([
          booking1,
          booking2,
          booking3,
        ]);

        expect(
          splitBookings.map((b) => {
            return { ...b };
          })
        ).deepEqual([
          { ...booking1, quantity: 2 },
          { ...booking1, quantity: 2 },
          { ...booking1, quantity: 1 },
          { ...booking2 },
          { ...booking3, quantity: 1 },
          { ...booking3, quantity: 1 },
        ]);
      });
    });
    describe('getShippingPolicies Tests', () => {
      it('builds correct shipping policy list', async () => {
        const p1: ShippingPolicy = await givenShippingPolicy();
        const p2: ShippingPolicy = await givenShippingPolicy();

        const prod1: Product = await givenProduct({ shippingPolicy: p1._id });
        const prod2: Product = await givenProduct({ shippingPolicy: p1._id });
        const prod3: Product = await givenProduct({ shippingPolicy: p1._id });
        const prod4: Product = await givenProduct({ shippingPolicy: p2._id });
        const prod5: Product = await givenProduct({ shippingPolicy: p2._id });

        const bookings: Booking[] = [
          await givenProductBooking({ item: prod1 }),
          await givenProductBooking({ item: prod2 }),
          await givenProductBooking({ item: prod3 }),
          await givenProductBooking({ item: prod4 }),
          await givenProductBooking({ item: prod5 }),
        ];

        const service = new ShippingService(
          shippingOrderRepository,
          shippingPolicyRepository,
          shippingBoxRepository
        );
        shippingPolicyRepository.stubs.findById.onFirstCall().resolves(p1);
        shippingPolicyRepository.stubs.findById.onSecondCall().resolves(p2);

        const policies = await service.getShippingPolicies(bookings);
        const expectedPolicies: ShippingPolicyList = {};

        // We can't use ! on _id because of lint so we use this null check to set a value that will make the
        // test fail if _id doesn't exist
        expectedPolicies[p1._id ?? ''] = p1;
        expectedPolicies[p2._id ?? ''] = p2;

        expect(policies).deepEqual(expectedPolicies);
      });
    });
  });

  function givenShippingOrderRepository() {
    shippingOrderRepository = createStubInstance(ShippingOrderRepository);
  }

  function givenShippingBoxRepository() {
    shippingBoxRepository = createStubInstance(ShippingBoxRepository);
  }

  function givenShippingPolicyRepository() {
    shippingPolicyRepository = createStubInstance(ShippingPolicyRepository);
  }
});
