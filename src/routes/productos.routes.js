const express = require('express');
const controller = require('../controllers/productos.controller');
const sanitize = require('../middlewares/sanitize.middleware');
const pagination = require('../middlewares/pagination.middleware');
const productHash = require('../middlewares/hash.middleware');
const { validateId, validateProductBody } = require('../middlewares/validate.middleware');

const router = express.Router();

router.get('/', sanitize, pagination, controller.getAll);
router.get('/:id', sanitize, validateId, controller.getById);
router.post('/', sanitize, validateProductBody(), productHash, controller.create);
router.put('/:id', sanitize, validateId, validateProductBody(), productHash, controller.update);
router.patch('/:id', sanitize, validateId, validateProductBody({ partial: true }), productHash, controller.patch);
router.delete('/:id', sanitize, validateId, controller.remove);

module.exports = router;
