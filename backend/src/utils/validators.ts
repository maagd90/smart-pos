import { body, query, param } from 'express-validator';

export const loginValidation = [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
];

export const registerValidation = [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 8 }),
  body('name').trim().isLength({ min: 2 }),
  body('role').isIn(['OWNER', 'MANAGER', 'CASHIER', 'ANALYST']),
];

export const changePasswordValidation = [
  body('currentPassword').isLength({ min: 6 }),
  body('newPassword').isLength({ min: 8 }),
];

export const productValidation = [
  body('name').trim().isLength({ min: 1 }),
  body('sku').trim().isLength({ min: 1 }),
  body('price').isFloat({ min: 0 }),
  body('costPrice').optional().isFloat({ min: 0 }),
  body('category').trim().isLength({ min: 1 }),
  body('stock').optional().isInt({ min: 0 }),
  body('minStock').optional().isInt({ min: 0 }),
];

export const customerValidation = [
  body('name').trim().isLength({ min: 1 }),
  body('phone').optional().isMobilePhone('any'),
  body('email').optional().isEmail().normalizeEmail(),
];

export const transactionValidation = [
  body('items').isArray({ min: 1 }),
  body('items.*.productId').isUUID(),
  body('items.*.quantity').isInt({ min: 1 }),
  body('paymentMethod').isIn(['CASH', 'CARD', 'DIGITAL_WALLET']),
];

export const campaignValidation = [
  body('name').trim().isLength({ min: 1 }),
  body('channel').isIn(['WHATSAPP', 'SMS', 'EMAIL']),
  body('template').trim().isLength({ min: 1 }),
];

export const stockAdjustmentValidation = [
  body('productId').isUUID(),
  body('type').isIn(['ADDITION', 'SUBTRACTION', 'WASTE', 'CORRECTION']),
  body('quantity').isInt({ min: 1 }),
];

export const paginationValidation = [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
];

export const uuidParam = [param('id').isUUID()];
