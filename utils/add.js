const uuidv4 = require('uuid/v4');

let add = {};


add.Login = function (account, req) {
    var uuids = {
        "loginUuid": uuidv4(),
        "creditCardUuid" : uuidv4(),
        "billingUuid" : uuidv4(),
        "shippingUuid" : uuidv4()
    };

    var loginHeaders = {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_4) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/57.0.2987.133 Safari/537.36',
        'Referer': 'https://s3.nikecdn.com/unite/',
    };

    var email = account.split(':')[0],
        password = account.split(':')[1];

    var loginData = {
        "username": email,
        "password": password,
        "keepMeLoggedIn": true,
        "client_id": "PbCREuPr3iaFANEDjtiEzXooFl7mXGQ7",
        "ux_id": "com.nike.commerce.snkrs.web",
        "grant_type": "password"
    };

    var loginParams = {
        "appVersion": 348,
        "experienceVersion": 301,
        "uxid": "com.nike.commerce.snkrs.web",
        "locale": "en_US",
        "backendEnvironment": "identity",
        "browser": "Google Inc.",
        "os": "undefined",
        "mobile": false,
        "native": false,
        "visit": 1,
        "visitor": uuids.loginUuid
    };

    var options = {
        url: 'https://unite.nike.com/login',
        method: 'post',
        qs: loginParams,
        headers: loginHeaders,
        body: loginData,
        json: true,
        proxy: formatProxy(proxies[Math.floor(Math.random() * proxies.length)])
    };

    req(options, function (err, res, body) {
        if (err) {

            log(`Request Error Logging In ${err}`, "error");
            setTimeout(add.Login, 1500, account, req);

        } else if (res.statusCode === 200) {

            var loginInfo = {
                "user_id": body.user_id,
                "access_token": body.access_token
            };

            log(`[${email}] Logged In`, "success");

            if (body.access_token !== undefined) {

                add.CreditCard(account, req, uuids, loginInfo);

            } else {

                setTimeout(add.Login, 1500, account, req);

            }

        } else if (res.statusCode === 403) {

            log(`[${email}] Proxy Banned On Login`, "error");
            setTimeout(add.Login, 1500, account, req);

        } else if (!err && body.error_description === 'Your email or password was entered incorrectly.') {
            log(`[${email}] Incorrect Login Credentials`, "error");
        } else if (res.statusCode === 500) {
            log(`[${email}] Internal Server Error On Login`, "error");
            setTimeout(add.Login, 1500, account, req);
        }
        else {
            log(`[${email}] Unhandled Error Logging In`, "error");
            console.log(body);
            console.log(res.statusCode);
        }
    })
};

add.CreditCard = function (account, req, uuids, loginInfo) {
    var data = {
        "expirationMonth": profile.expiryMonth,
        "accountNumber": profile.cardNumber,
        "creditCardInfoId": uuids.creditCardUuid,
        "cvNumber": profile.cvv,
        "cardType": profile.cardType,
        "expirationYear": profile.expiryYear
    };

    req(
        {
            url: `https://paymentcc.nike.com/creditcardsubmit/${uuids.creditCardUuid}/store`,
            method: 'post',
            json: data,
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 6.3; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.96 Safari/537.36",
                "Authorization": `Bearer ${loginInfo.access_token}`
            },
            proxy: formatProxy(proxies[Math.floor(Math.random() * proxies.length)])
        }, function (err, res, body) {
            if (err) {
                log(`[${account.split(':')[0]}] Request Error Adding Credit Card ${err}`, "error");
                setTimeout(add.CreditCard, 1500, account, req, uuids, loginInfo);
            } else if (res.statusCode === 403) {
                log(`[${account.split(':')[0]}] Proxy Banned Adding Credit Card`, "error");
                setTimeout(add.CreditCard, 1500, account, req, uuids, loginInfo);
            } else if (res.statusCode === 201) {
                log(`[${account.split(':')[0]}] Added Credit Card`, "success");
                add.BillingAddress(account, req, uuids, loginInfo);
            } else {
                log(`[${account.split(':')[0]}] Unhandled Error Adding Credit Card`, "error");
                console.log(body);
                console.log(res.statusCode);
            }
        }
    )

};

add.BillingAddress = function (account, req, uuids, loginInfo) {
    var data = {
        "balance": "0",
        "billingAddress": {
            "address1": profile.address,
            "address2": profile.apt,
            "city": profile.city,
            "country": "US",
            "firstName": profile.firstName,
            "guid": uuids.billingUuid,
            "label": "",
            "lastName": profile.lastName,
            "phoneNumber": profile.phone,
            "postalCode": profile.zip,
            "preferred": true,
            "state": profile.state
        },
        "creditCardInfoId": uuids.creditCardUuid,
        "isDefault": true,
        "type": "CreditCard",
        "validateCVV": false
    };

    req(
        {
            url: 'https://api.nike.com/commerce/storedpayments/consumer/savepayment',
            method: 'post',
            proxy: formatProxy(proxies[Math.floor(Math.random() * proxies.length)]),
            json: data,
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 6.3; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.96 Safari/537.36",
                "Authorization": `Bearer ${loginInfo.access_token}`
            }
        }, function (err, res, body) {
            if (err) {
                log(`[${account.split(':')[0]}] Request Error Adding Billing Address ${err}`, "error");
                setTimeout(add.BillingAddress, 1500, account, req, uuids, loginInfo);
            } else if (res.statusCode === 201 && body.status === 'success') {
                log(`[${account.split(':')[0]}] Added Billing Address`, "success");
                add.ShippingAddress(account, req, uuids, loginInfo);
            } else if (res.statusCode === 403) {
                log(`[${account.split(':')[0]}] Proxy Banned Adding Billing Address`, "error");
                setTimeout(add.BillingAddress, 1500, account, req, uuids, loginInfo);
            } else {
                log(`[${account.split(':')[0]}] Unhandled Error Adding Billing Address`, "error");
                console.log(body);
                console.log(res.statusCode);
            }
        }
    )
};

add.ShippingAddress = function (account, req, uuids, loginInfo) {
    var data = {
        "address": {
            "shipping": {
                "code": profile.zip,
                "country": "US",
                "guid": uuids.shippingUuid,
                "label": "Thanks @_zruss_",
                "line1": profile.address,
                "line2": profile.apt,
                "locality": profile.city,
                "name": {
                    "primary": {
                        "family": profile.lastName,
                        "given": profile.firstName
                    }
                },
                "phone": {
                    "primary": profile.phone
                },
                "preferred": true,
                "province": profile.state,
                "type": "SHIPPING"
            }
        }
    };

    req(
        {
            url: 'https://api.nike.com/user/commerce',
            method: 'put',
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 6.3; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.96 Safari/537.36",
                "Authorization": `Bearer ${loginInfo.access_token}`
            },
            json: data
        }, function (err, res, body) {
            if (err) {
                log(`[${account.split(':')[0]}] Request Error Adding Shipping Address ${err}`, "error");
                setTimeout(add.ShippingAddress, 1500, account, req, uuids, loginInfo);
            } else if (res.statusCode === 202) {
                log(`[${account.split(':')[0]}] Adding Shipping Address`, "success");
            } else if (res.statusCode === 403) {
                log(`[${account.split(':')[0]}] Proxy Banned Adding Shipping Address`, "error");
                setTimeout(add.ShippingAddress, 1500, account, req, uuids, loginInfo);
            } else {
                log(`[${account.split(':')[0]}] Unhandled Error Adding Shipping Address`, "error");
                console.log(body);
                console.log(res.statusCode);
            }
        }
    )
};


// also created by @hunter_bdm because I am too lazy 😄
function formatProxy(proxy) {
    if (proxy && ['localhost', ''].indexOf(proxy) < 0) {
        proxy = proxy.replace(' ', '_');
        const proxySplit = proxy.split(':');
        if (proxySplit.length > 3)
            return "http://" + proxySplit[2] + ":" + proxySplit[3] + "@" + proxySplit[0] + ":" + proxySplit[1];
        else
            return "http://" + proxySplit[0] + ":" + proxySplit[1];
    }
    else
        return undefined;
}


module.exports = add;