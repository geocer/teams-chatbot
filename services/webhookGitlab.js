const request = require("request");
const logger = require('../metrics/logger');

async function WebHookCD(context, action) {

    process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
    const auth = process.env.CD_AUTH || "";
    const url_cd = process.env.CD_URI || "https:///api/v4/projects";
    
    //curl -X PUT -d "bar" -H "PRIVATE-TOKEN: " "https://gitlab.example.com/api/v4/settings/ci/variables/FOO"
    const options = {
        method: 'POST',
        url: `${ url_cd }/${ context.project_id }/jobs/${ context.job_id }/${ action } `,
        headers: {
            'cache-control': 'no-cache',
            'content-type': 'application/json',
            "Private-Token": auth
        },
        json: true
    };

    logger.debug(options);

    return new Promise(function (resolve, reject) {

        request(options, function (err, resp, body) {

            console.log("fWebHookCD:", resp.statusCode);

            if (err) {
                reject(err);
            } else {

                try {
                    resolve(body);
                } catch (err) {
                    reject(err);
                }

            }

        });

    });

}

module.exports.WebHookCD = WebHookCD;
