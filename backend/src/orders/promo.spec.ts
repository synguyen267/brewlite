import { BadRequestException } from '@nestjs/common';
import { applyPromo, calcLoyaltyPoints } from './promo';

describe('Khuyến mãi và điểm thưởng', () => {
  it('không nhập mã thì không giảm', () => {
    expect(applyPromo(undefined, 100000)).toEqual({
      discount: 0,
      promoCode: null,
    });
    expect(applyPromo('  ', 100000)).toEqual({ discount: 0, promoCode: null });
  });

  it('BREW10 giảm 10%', () => {
    expect(applyPromo('BREW10', 200000)).toEqual({
      discount: 20000,
      promoCode: 'BREW10',
    });
  });

  it('BREW10 bị chặn trần 30.000đ', () => {
    expect(applyPromo('BREW10', 500000).discount).toBe(30000);
  });

  it('không phân biệt chữ hoa thường', () => {
    expect(applyPromo(' brew10 ', 100000).promoCode).toBe('BREW10');
  });

  it('GIAM20K giảm 20.000đ khi đủ 100.000đ', () => {
    expect(applyPromo('GIAM20K', 100000).discount).toBe(20000);
  });

  it('GIAM20K bị từ chối khi đơn dưới 100.000đ', () => {
    expect(() => applyPromo('GIAM20K', 99000)).toThrow(BadRequestException);
  });

  it('mã không tồn tại bị từ chối', () => {
    expect(() => applyPromo('SAIMA', 100000)).toThrow(BadRequestException);
  });

  it('cộng 1 điểm cho mỗi 1.000đ', () => {
    expect(calcLoyaltyPoints(120000)).toBe(120);
    expect(calcLoyaltyPoints(125500)).toBe(125);
    expect(calcLoyaltyPoints(999)).toBe(0);
  });
});
