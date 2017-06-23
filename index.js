'use strict';


let fatalError = (msg) => {
    console.error(msg);
    process.exit(1);
};

if (process.argv.length < 4) {
    fatalError('Too less input parameters');
}

const url = process.argv[2];
let n = process.argv[3];

let request = require('request');

const NAME_COLUMN = 0;
const RUNNING_TIME_COLUMN = 1;
const RATING_COLUMN = 2;

const DOUBLE_QUOTE = '"';
const CSV_SEPARATOR = ',';

n = parseInt(n, 10);

if (n <= 0) {
    fatalError('n should not less than 0');
}

request(url, function (error, response, body) {
    if (error) {
        fatalError('FATAL Error: ' + error);
    }

    if (!(response && response.statusCode === 200)) {
        fatalError('Request failed: ' + response.statusCode);
    }
    if (body.length === 0) {
        fatalError('Response is empty');
    }

    const csvLines = body.split('\n');

    if (csvLines.length === 1) {
        fatalError('CSV data is invalid');
    }

    const columnDef = parseCSVLine(csvLines[0]);
    const columnLength = columnDef.length;
    const data = csvLines.slice(1);
    let topN = [];

    data.forEach((line) => {
        let lineArr = parseCSVLine(line);

        if (lineArr.length !== columnLength) {
            fatalError('The input is not a valid CSV file');
        }

        let lineObj = {
            'name': lineArr[NAME_COLUMN],
            'running_time': lineArr[RUNNING_TIME_COLUMN],
            'rating': parseFloat(lineArr[RATING_COLUMN])
        };

        topN = calculateTopN(n, topN, lineObj);
    });

    for (let i = topN.length - 1; i >= 0; i--) {
        console.log(topN[i]);
    }
    process.exit(0);
});

let parseCSVLine = (line) => {
    let isInString = false;
    let section = '';
    let result = [];
    for (let i = 0; i < line.length; i++) {
        let c = line.charAt(i);
        if (isInString) {
            if (c === DOUBLE_QUOTE) { // String end quote.
                isInString = false;
            } else { // Keep reading.
                section += c;
            }
        } else {
            if (c === DOUBLE_QUOTE) { // String start quote.
                isInString = true;
                continue;
            }
            if (c === CSV_SEPARATOR) { // Section breaker.
                result.push(section);
                section = '';
            } else { // Keep reading.
                section += c;
            }
        }
    }
    if (section) {
        result.push(section);
    }
    return result;
};

let calculateTopN = (n, top, lineObj) => {
    let lineRating = lineObj.rating;

    if (top.length === 0) {
        return [lineObj];
    }
    let breakPoint = 0;
    for (let i = 0; i < top.length; i++) {
        let rating = top[i].rating;
        if (lineRating <= rating) {
            breakPoint = i;
            break;
        }
    }
    const l = top.length;
    if (breakPoint > 0) { // Break at somewhere.
        for (let i = l; i > breakPoint; i--) {
            top[i] = top[i - 1];
        }
        top[breakPoint] = lineObj;
    } else { // Not break at all.
        if (lineRating > top[0].rating) { // Only handle the lineRating bigger than first one case. Other case is just the line rating is smaller than every element.
            top[l] = lineObj;
        }
    }

    if (top.length > n) {
        top = top.slice(1);
    }

    return top;
};
