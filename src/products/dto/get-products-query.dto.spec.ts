import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { GetProductsQueryDto } from './get-products-query.dto';

async function parse(query: Record<string, unknown>) {
  const dto = plainToInstance(GetProductsQueryDto, query);
  const errors = await validate(dto);
  return { dto, errors };
}

describe('GetProductsQueryDto', () => {
  it('parses "true"/"1" as true', async () => {
    for (const raw of ['true', 'True', '1']) {
      const { dto, errors } = await parse({ isBestSeller: raw });
      expect(errors).toHaveLength(0);
      expect(dto.isBestSeller).toBe(true);
    }
  });

  it('parses "false"/"0" as false', async () => {
    for (const raw of ['false', 'False', '0']) {
      const { dto, errors } = await parse({ isBestSeller: raw });
      expect(errors).toHaveLength(0);
      expect(dto.isBestSeller).toBe(false);
    }
  });

  it('leaves the filter undefined when omitted', async () => {
    const { dto, errors } = await parse({});
    expect(errors).toHaveLength(0);
    expect(dto.isBestSeller).toBeUndefined();
  });

  it('rejects unparseable values with a validation error', async () => {
    const { errors } = await parse({ isBestSeller: 'maybe' });
    expect(errors.length).toBeGreaterThan(0);
  });
});
