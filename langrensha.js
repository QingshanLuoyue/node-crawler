var https = require('https');
var fs = require('fs');
var cheerio = require('cheerio');
var xlsx = require('node-xlsx');
var i = 1;
var news_item = [];
var allUrl = [];
// var filename = 'android-langrensha'
var filename = 'ios-langrensha'

// 安卓基本信息
// var androidBase = encodeURI('https://aso100.com/andapp/baseinfo/appid/2232458')
// 安卓总下载量
// var androidDown = encodeURI('https://aso100.com/andapp/downTotal/appid/2232458')

var androidurl = encodeURI('https://aso100.com/search/searchAndroidMore?page=1&search=狼人杀&date=2017-05-23')

var iosurl= encodeURI('https://aso100.com/search/searchMore?page=1&device=iphone&search=狼人杀&country=cn&brand_id=1&kdate=2017-05-23&ydate=2017-05-22')

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
				// var app_title = $(this).find('.media-heading a').text().trim();
				// if (app_title == '') { app_title = ' '}
				// var app_title = $(this).find('.media-heading a').text().trim().split('、')[1];

				// 序号
				var rankNum = $(this).find('.media-heading a').text().trim().split('、')[0]
				if (rankNum == '') { rankNum = ' '}

				// 获取详细信息的url
				var baseinfoUrl = 'https://aso100.com' + $(this).find('.media-heading a').attr('href');
				if (baseinfoUrl == '') { baseinfoUrl = ' '}

				// var app_author = $(this).find('.media-auther').text().trim();
				// if (app_author == '') { app_author = ' '}

				// var simple_item = [rankNum, app_title, app_author, baseinfoUrl]
				var simple_item = [rankNum]
				news_item.push(simple_item)
				allUrl.push(baseinfoUrl)
			})
			i = i + 1;
			if (filename == 'android-langrensha') {
				// 安卓请求地址
				var nextLink = encodeURI('https://aso100.com/search/searchAndroidMore?page='+ i + '&search=狼人杀&date=2017-05-23');
			} else if (filename == 'ios-langrensha') {
				// ios请求地址
				var nextLink = encodeURI('https://aso100.com/search/searchMore?page='+ i + '&device=iphone&search=狼人杀&country=cn&brand_id=1&kdate=2017-05-23&ydate=2017-05-22')
			}

			console.log('news_item = ',news_item)
			if (i <= 1 && html != '') {
				console.log('下一次')
				// 10秒执行一次
				setTimeout(function(){
					fetchPage(nextLink);
				}, 10000)
			} else {
				// 3秒后执行
				setTimeout(function(){
					// savedContent(news_item);
					// 获取基础信息
					getBaseInfo()
				}, 6000)
			}
		})
	}).on('error', function(err) {
		console.log(err);
	})
}

// 获取基础信息
var count = 0;
function getBaseInfo() {
	console.log('filename', filename)
	var len = news_item.length;
	var baseTitle = '', author = '', bundleId = '', appId = '';

	if (filename == 'android-langrensha') {
		// 请求基础信息url
		var detailsUrl = allUrl[count];
	} else if (filename == 'ios-langrensha') {
		// 请求基础信息url
		// https://aso100.com/app/rank/appid/1126393139/country/cn
		// https://aso100.com/app/baseinfo/appid/1126393139/country/cn
		var detailsUrl = allUrl[count].replace(/rank/, 'baseinfo');
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
			baseTitle = $$('.container-appinfo').find('.appinfo-title').text().trim();
			if (baseTitle == '') { baseTitle = ' '}

			if (filename == 'android-langrensha') {
				$$('.container-appinfo').find('.appinfo-auther').each(function(){
					var nameP = $$(this).find('.name').text().trim();
					if (nameP.indexOf('开发商') > -1) {
						// 开发商
						author = $$(this).find('.content').text().trim();
					} else if (nameP.indexOf('Bundle ID') > -1) {
						// bundleId
						bundleId = $$(this).find('.content').text().trim();
					}
				})
			} else if (filename == 'ios-langrensha') {
				$$('.container-appinfo').find('.appinfo-auther').each(function(){
					var nameP = $$(this).find('.name').text().trim();
					if (nameP.indexOf('开发商') > -1) {
						// 开发商
						author = $$(this).find('.content').text().trim();
					} else if (nameP.indexOf('App ID') > -1) {
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
			// 开发商
			if (author == '') { author = ' '}

			// bundleId
			if (bundleId == '') { bundleId = ' '}

			// AppId
			if (appId == '') { appId = ' '}

			console.log('baseTitle', baseTitle)
			console.log('author', author)
			console.log('bundleId', bundleId)
			console.log('appId', appId)
			news_item[count].push(baseTitle, author, bundleId, appId)
			console.log('getBaseInfo后news_item = ',news_item)
			
			// 请求下载量url
			if (filename == 'android-langrensha') {
				// 'https://aso100.com/andapp/downTotal/appid/3387630?_pjax=#container'
				var downTotalUrl = encodeURI(allUrl[count].replace(/baseinfo/, 'downTotal') + '?_pjax=#container');
			} else if (filename == 'ios-langrensha') {
				var downTotalUrl = '';
			}
			console.log('downTotalUrl', downTotalUrl)

			// 获取下载量
			if (!downTotalUrl) {
				writeToexcel(news_item);
				if (count < 4) {
					count++;
					// 10秒执行一次
					setTimeout(function(){
						getBaseInfo(allUrl[count])
					}, 10000)
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
					getDownTotal(downTotalUrl)
				}, 6000)
			}
		})
	})
}

// 获取下载量
function getDownTotal(downTotalUrl) {
	https.get(downTotalUrl, function(res) {
		var downTotalNum = '';
		res.setEncoding('utf-8');
		res.on('data', function(chunk) {
			downTotalNum += chunk;
		})
		res.on('end', function() {
			var $$$ = cheerio.load(downTotalNum);
			if (filename == 'android-langrensha') {
				totalNum = $$$('.table.rank').find('.rank span').text().trim();
			} else if (filename == 'ios-langrensha') {

			}
			if (totalNum == '') { totalNum = ' '}

			console.log('totalNum', totalNum)
			news_item[count].push(totalNum)
			console.log('getDownTotal后news_item = ',news_item)
			writeToexcel(news_item);
			if (count < 4) {
				count++;
				// 10秒执行一次
				setTimeout(function(){
					getBaseInfo(allUrl[count])
				}, 10000)
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
		})
	})
}

// 写进excel文件
function writeToexcel(resData) {
	// var obj = xlsx.parse(__dirname + '/paiqi.xlsx');
	// var excelObj = obj[0].data;
	// console.log(excelObj);

	var finalRes = [['序号', '产品名称', '公司', 'bundleID', 'appId', '下载量' ]].concat(resData);
	console.log(finalRes)

	var buffer = xlsx.build([
	    {
	        name:'sheet1',
	        data:finalRes
	    }        
	]);
	console.log('写进excel了')
	//将文件内容插入新的文件中
	fs.writeFileSync('langrensha.xlsx',buffer,{'flag':'w'});
}
// fetchPage(androidurl, 'android-langrensha');
fetchPage(iosurl);




