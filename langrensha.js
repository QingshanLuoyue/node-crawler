var https = require('https');
var fs = require('fs');
var cheerio = require('cheerio');
var xlsx = require('node-xlsx');

var maxpage = 10; // 控制可获取的最大页数
var maxSingleMsgNub = 200;  // 控制可获取的数据条数
var waitTime = 10000;  // 每一次请求的等待时间
// writeToTxt(1, 0, '棋牌')
var searchWord = '狼人杀';  // 搜索关键字
var compareWord = readFromTxt().word ? readFromTxt().word : '狼人杀';
if (compareWord != searchWord) {
	writeToTxt(1, 0, searchWord);
}
var i = readFromTxt() ? readFromTxt().i : 1; // 控制获取的当前页数，每一页20条数据
var count = readFromTxt() ? readFromTxt().count : 0;  // 从本程序执行开始获取的new_item的序号
var androidOrIosSearchDate = '2017-05-25';
var iosCompareDate = '2017-05-24';

// writeToTxt(i, count)
// console.log(i)
// console.log(count)
console.log('readFromTxt = ', readFromTxt())


// 获取的结果数据集合
// var news_item = [];
var obj = xlsx.parse(__dirname + '/langrensha.xlsx');
var excelObj = obj[0].data;
if (excelObj) {
	excelObj.splice(0,1)
	var news_item = excelObj.splice(0, count);
	for (var k = 0; k < news_item.length; k++) {
		news_item[k].unshift(' ');
	}
} else {
	var news_item = [];
}
// console.log('news_item = ', news_item);
// console.log('excelObj = ', excelObj);

// 请求安卓数据
var filename = 'android-langrensha'
// 请求ios数据
// var filename = 'ios-langrensha';

if (filename == 'android-langrensha') {
	// https://aso100.com/search/searchAndroidMore?page=2&search=%E7%8B%BC%E4%BA%BA&date=2017-05-26
	var initialurl = encodeURI('https://aso100.com/search/searchAndroidMore?page='+ i +'&search='+ searchWord +'&date=' + androidOrIosSearchDate)
} else if (filename == 'ios-langrensha') {
	var initialurl= encodeURI('https://aso100.com/search/searchMore?page='+ i +'&device=iphone&search='+ searchWord +'&country=cn&brand_id=1&kdate='+ androidOrIosSearchDate +'&ydate='+ iosCompareDate)
}

// 加了一层封装
function fetchPage(url) {
	startRequest(url);
}

// 开始请求数据
function startRequest(url) {
	console.log('lurl = ', url)
	https.get(url, function(res) {
		var html = '';
		var titles = [];
		res.setEncoding('utf-8');
		res.on('data', function(chunk) {
			html += chunk;
		})
		res.on('end', function() {
			var $ = cheerio.load(html);
			$('.media').each(function(){
				// 序号
				var rankNum = $(this).find('.media-heading a').text().trim().split('、')[0]
				if (rankNum == '') { rankNum = ' '}
				
				// 产品名称
				// var app_title = $(this).find('.media-heading a').text().trim();
				var app_title = $(this).find('.media-heading a').text().trim().split('、')[1];
				if (app_title == '') { app_title = ' '}

				// 开发商／公司
				var app_author = $(this).find('.media-auther').text().trim();
				if (app_author == '') { app_author = ' '}
				
				// 获取详细信息的url
				var baseinfoUrl = 'https://aso100.com' + $(this).find('.media-heading a').attr('href');
				if (baseinfoUrl == '') { baseinfoUrl = ' '}
				// console.log('rankNum = ', rankNum)
				// console.log('count = ', count)
				if (rankNum > count) {
					// var simple_item = [rankNum, app_title, app_author, baseinfoUrl]
					var simple_item = [baseinfoUrl, rankNum, app_title, app_author]
					news_item.push(simple_item)
				}
			})

			console.log('news_item = ',news_item)
			if (html != '') {
				setTimeout(function(){
					// 获取基础信息
					getBaseInfo()
				}, waitTime)
			} else {
				console.log('获取数据为空：1、可能访问对方网站太频繁了，请求被禁止，请到网站上进行验证！2、或者后续已没有数据了')
			}
		})
	}).on('error', function(err) {
		console.log(err);
	})
}

// 获取基础信息

function getBaseInfo() {
	console.log('filename', filename)
	var len = news_item.length;
	var baseTitle = '', author = '', bundleId = '', appId = '';

	if (filename == 'android-langrensha') {
		// 请求基础信息url
		var detailsUrl = news_item[count][0];
	} else if (filename == 'ios-langrensha') {
		// 请求基础信息url
		// https://aso100.com/app/rank/appid/1126393139/country/cn
		// https://aso100.com/app/baseinfo/appid/1126393139/country/cn
		var detailsUrl = news_item[count][0].replace(/rank/, 'baseinfo');
	}
	console.log('detailsUrl', detailsUrl)

	https.get(detailsUrl, function(res) {
		var baseinfo = '';
		res.setEncoding('utf-8');
		res.on('data', function(chunk) {
			baseinfo += chunk;
		})
		res.on('end', function() {
			var $$ = cheerio.load(baseinfo);
			// console.log('baseinfo = ', baseinfo)
			// 产品名称
			// baseTitle = $$('.container-appinfo').find('.appinfo-title').text().trim();
			// if (baseTitle == '') { baseTitle = ' '}

			if (filename == 'android-langrensha') {
				$$('.container-appinfo').find('.appinfo-auther').each(function(){
					var nameP = $$(this).find('.name').text().trim();
					if (nameP.indexOf('Bundle ID') > -1) {
						// bundleId
						bundleId = $$(this).find('.content').text().trim();
					}
				})
			} else if (filename == 'ios-langrensha') {
				$$('.container-appinfo').find('.appinfo-auther').each(function(){
					var nameP = $$(this).find('.name').text().trim();
					if (nameP.indexOf('App ID') > -1) {
						// AppId
						appId = $$(this).find('.content a').text().trim();
					}
				})
				$$('.container-baseinfo').find('.base-info.base-area tr').each(function(){
					var nameP = $$(this).find('.name').text().trim();
					if (nameP.indexOf('Bundle ID') > -1) {
						// bundleId
						bundleId = $$(this).find('.name').siblings('td').text().trim();
					}
				})
			}
			// 开发商／公司
			// if (author == '') { author = ' '}

			// bundleId
			if (bundleId == '') { bundleId = ' '}

			// AppId
			if (appId == '') { appId = ' '}

			// console.log('baseTitle', baseTitle)
			// console.log('author', author)
			console.log('bundleId', bundleId)
			console.log('appId', appId)
			if (filename == 'android-langrensha') {
				news_item[count].push(bundleId)
			} else if (filename == 'ios-langrensha') {
				news_item[count].push(bundleId, appId)
			}
			console.log('getBaseInfo后news_item = ',news_item)
			
			// 请求下载量url
			if (filename == 'android-langrensha') {
				// 'https://aso100.com/andapp/downTotal/appid/3387630?_pjax=#container'
				var downTotalUrl = encodeURI(news_item[count][0].replace(/baseinfo/, 'downTotal') + '?_pjax=#container');
			} else if (filename == 'ios-langrensha') {
				var downTotalUrl = '';
			}
			console.log('downTotalUrl', downTotalUrl)

			// 获取下载量
			if (!downTotalUrl) {
				writeToexcel(news_item);
				if (count < len - 1) {
					count++;
					writeToTxt(i, count)
					// 10秒执行一次
					setTimeout(function(){
						getBaseInfo(news_item[count][0])
					}, waitTime)
					// 写下数据了
				} else {
					var x = '';
					console.log('写进html了')
					x += '<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"></head><body>'
					x += JSON.stringify(news_item)
					x += '</body></html>'
					fs.writeFile('./langrensha/'+ filename + '.html', x, 'utf-8', function(err) {
						if (err) {
							console.log(err);
						}
					})
				}
			} else {
				setTimeout(function(){
					getDownTotal(downTotalUrl, len)
				}, waitTime)
			}
		})
	})
}

// 获取下载量
function getDownTotal(downTotalUrl, len) {
	https.get(downTotalUrl, function(res) {
		var downTotalNum = '';
		res.setEncoding('utf-8');
		res.on('data', function(chunk) {
			downTotalNum += chunk;
		})
		res.on('end', function() {
			var $$$ = cheerio.load(downTotalNum);
			if (filename == 'android-langrensha') {
				var totalNum = $$$('.table.rank').find('.rank span').text().trim();
			} else if (filename == 'ios-langrensha') {

			}
			if (totalNum == '') { totalNum = ' '}

			console.log('totalNum', totalNum)
			news_item[count].push(totalNum)
			if (news_item[count][4] == ' ' && totalNum == ' ') {
				console.log('bundleId和totalNum都为空，可能访问对方网站太频繁了，请求被禁止，请到网站上进行验证，以便再次爬取数据！')
				return;
			}
			console.log('getDownTotal后news_item = ',news_item)
			writeToexcel(news_item);
			if (count < (maxSingleMsgNub - 1) ) {
				if (count < (len - 1)) {
					count++;
					writeToTxt(i, count)
					// 10秒执行一次
					setTimeout(function(){
						getBaseInfo(news_item[count][0])
					}, waitTime)
				} else {
					// 第一次拉取20条数据，继续拉取完20条数据的基本信息和下载量之后，第二次继续拉取20-40的数据
					i = i + 1;
					writeToTxt(i, count)
					if (filename == 'android-langrensha') {
						// 安卓请求地址
						var nextLink = encodeURI('https://aso100.com/search/searchAndroidMore?page='+ i + '&search='+ searchWord +'&date=2017-05-23');
					} else if (filename == 'ios-langrensha') {
						// ios请求地址
						var nextLink = encodeURI('https://aso100.com/search/searchMore?page='+ i + '&device=iphone&search='+ searchWord +'&country=cn&brand_id=1&kdate=2017-05-23&ydate=2017-05-22')
					}
					if (i < maxpage) {
						count++;
						writeToTxt(i, count)
						console.log('下一次')
						// 20秒执行一次
						setTimeout(function(){
							fetchPage(nextLink);
						}, waitTime)
					}

					// var x = '';
					// console.log('写进html了')
					// x += '<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"></head><body>'
					// x += JSON.stringify(news_item)
					// x += '</body></html>'
					// fs.writeFile('./langrensha/'+ filename + '.html', x, 'utf-8', function(err) {
					// 	if (err) {
					// 		console.log(err);
					// 	}
					// })
				}
			}
		})
	})
}

// 写进excel文件
function writeToexcel(resData) {
	// var obj = xlsx.parse(__dirname + '/paiqi.xlsx');
	// var excelObj = obj[0].data;
	// console.log(excelObj);
	var solveData = JSON.parse(JSON.stringify(resData));
	// 去除链接
	for (var i = 0; i < solveData.length; i++) {
		solveData[i].splice(0, 1);
	}
	if (filename == 'android-langrensha') {
		var finalRes = [['序号', '产品名称', '公司', 'bundleID', '下载量' ]].concat(solveData);
	} else if (filename == 'ios-langrensha') {
		var finalRes = [['序号', '产品名称', '公司', 'bundleID', 'appId']].concat(solveData);
	}
	console.log('*******************************************************************')
	// console.log('finalRes = ', finalRes)

	var buffer = xlsx.build([
	    {
	        name:'sheet1',
	        data:finalRes
	    }
	]);
	console.log('第'+ (count + 1) +'条数据写进excel了' + '\n')
	//将文件内容插入新的文件中
	fs.writeFileSync('langrensha.xlsx',buffer,{'flag':'w'});
	// fs.writeFileSync('langrensha-back.xlsx',buffer,{'flag':'w'});
}

function writeToTxt(i, count, word) {
	if (!word) {
		var word = searchWord;
	}
	var str = '{"i":'+ i +',"count":'+ count +',"word":"'+ word +'"}';
	fs.writeFileSync('record.txt', str);
}

function readFromTxt() {
	var readTxt = fs.readFileSync('record.txt', 'utf-8');
	if (readTxt) {
		return JSON.parse(fs.readFileSync('record.txt', 'utf-8'));
	} else {
		return '';
	}
}

fetchPage(initialurl);




