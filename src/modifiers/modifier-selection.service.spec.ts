import { ModifierSelectionService } from './modifier-selection.service';

describe('ModifierSelectionService', () => {
  let service: ModifierSelectionService;

  const product: any = {
    id: 'prod-1',
    price: 60,
    productModifierGroups: [
      {
        sortOrder: 1,
        modifierGroup: {
          id: 'mg_size',
          name: 'Size',
          selectionType: 'SINGLE',
          minSelect: 1,
          maxSelect: 1,
          isActive: true,
          options: [
            {
              id: 'mo_small',
              name: 'Small',
              priceAdjustment: 0,
              isAvailable: true,
            },
            {
              id: 'mo_large',
              name: 'Large',
              priceAdjustment: 20,
              isAvailable: true,
            },
          ],
        },
      },
      {
        sortOrder: 2,
        modifierGroup: {
          id: 'mg_extra',
          name: 'Extra',
          selectionType: 'MULTIPLE',
          minSelect: 0,
          maxSelect: 5,
          isActive: true,
          options: [
            {
              id: 'mo_shot',
              name: 'Extra Shot',
              priceAdjustment: 20,
              isAvailable: true,
            },
            {
              id: 'mo_oat',
              name: 'Oat Milk',
              priceAdjustment: 25,
              isAvailable: false,
            },
          ],
        },
      },
    ],
  };

  beforeEach(() => {
    service = new ModifierSelectionService();
  });

  it('calculates final price from base price + adjustments', () => {
    const result = service.validateAndCalculate(product, [
      { modifierGroupId: 'mg_size', modifierOptionIds: ['mo_large'] },
      { modifierGroupId: 'mg_extra', modifierOptionIds: ['mo_shot'] },
    ]);
    expect(result).toEqual({
      basePrice: 60,
      modifierTotal: 40,
      finalUnitPrice: 100,
      selections: [
        {
          modifierGroupId: 'mg_size',
          modifierGroupName: 'Size',
          modifierOptionId: 'mo_large',
          modifierOptionName: 'Large',
          priceAdjustment: 20,
        },
        {
          modifierGroupId: 'mg_extra',
          modifierGroupName: 'Extra',
          modifierOptionId: 'mo_shot',
          modifierOptionName: 'Extra Shot',
          priceAdjustment: 20,
        },
      ],
    });
  });

  it('rejects SINGLE groups with more than one selection', () => {
    expect(() =>
      service.validateAndCalculate(product, [
        {
          modifierGroupId: 'mg_size',
          modifierOptionIds: ['mo_small', 'mo_large'],
        },
      ]),
    ).toThrow();
  });

  it('rejects missing required groups', () => {
    expect(() =>
      service.validateAndCalculate(product, [
        { modifierGroupId: 'mg_extra', modifierOptionIds: ['mo_shot'] },
      ]),
    ).toThrow();
  });

  it('rejects unavailable options', () => {
    expect(() =>
      service.validateAndCalculate(product, [
        { modifierGroupId: 'mg_size', modifierOptionIds: ['mo_small'] },
        { modifierGroupId: 'mg_extra', modifierOptionIds: ['mo_oat'] },
      ]),
    ).toThrow();
  });

  it('rejects options from another group', () => {
    expect(() =>
      service.validateAndCalculate(product, [
        { modifierGroupId: 'mg_size', modifierOptionIds: ['mo_shot'] },
      ]),
    ).toThrow();
  });

  it('supports negative price adjustments', () => {
    const discounted: any = {
      id: 'prod-2',
      price: 100,
      productModifierGroups: [
        {
          sortOrder: 1,
          modifierGroup: {
            id: 'mg_side',
            name: 'Side',
            selectionType: 'SINGLE',
            minSelect: 1,
            maxSelect: 1,
            isActive: true,
            options: [
              {
                id: 'mo_noside',
                name: 'No Side',
                priceAdjustment: -20,
                isAvailable: true,
              },
            ],
          },
        },
      ],
    };
    const result = service.validateAndCalculate(discounted, [
      { modifierGroupId: 'mg_side', modifierOptionIds: ['mo_noside'] },
    ]);
    expect(result.finalUnitPrice).toBe(80);
  });
});
