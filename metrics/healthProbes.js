/**
 * API redes Sociais Router Health
 * 
 */

const express = require('express');
const router = express.Router();
const logger = require('./metrics/logger');

/**
 * @typedef Response
 * @property {integer} count
 */

/**
 * Live
 * @route GET /devopsbot/live
 * @group DevopsBot - health
 * @produces application/json
 * @consumes application/json
 * @returns {Response.model} 200 - Status OK
 * @returns {Error}  503 - Unexpected error
 */
router.get('/live', async (req, res) => {

    try {

        let _obj = await Mongo.Project.findOne({}).count();

        logger.debug(_obj);

        res.status(200).json({
            "count": _obj
        });

    } catch(err) {
        logger.error(err);
        res.status(503).json({});
    }

});

/**
 * Health
 * @route GET /redes-sociais/read
 * @group HEALTHCHECKS - Read
 * @produces application/json
 * @consumes application/json
 * @returns {null} 204 - No content
 */
router.get('/read', async (req, res) => {

    res.status(204).json();

});

module.exports = app => app.use('/v1/health', router);