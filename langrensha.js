var https = require('https');
var fs = require('fs');
var cheerio = require('cheerio');
var xlsx = require('node-xlsx');
var i = 1;
var news_item = [];

// 安卓基本信息
// var androidBase = encodeURI('https://aso100.com/andapp/baseinfo/appid/2232458')
// 安卓总下载量
// var androidDown = encodeURI('https://aso100.com/andapp/downTotal/appid/2232458')

var androidurl = encodeURI('https://aso100.com/search/searchAndroidMore?page=1&search=狼人杀&date=2017-05-23')

var iosurl= encodeURI('https://aso100.com/search/searchMore?page=1&device=iphone&search=狼人杀&country=cn&brand_id=1&kdate=2017-05-23&ydate=2017-05-22')

// 加了一层封装
function fetchPage(url, filename) {
	startRequest(url, filename);
}

// 开始请求数据
function startRequest(url, filename) {
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
				var rankNum = $(this).find('.media-heading a').text().trim().split('、')[0]
				if (rankNum == '') { rankNum = ' '}

				var baseinfoUrl = 'https://aso100.com' + $(this).find('.media-heading a').attr('href');
				if (baseinfoUrl == '') { baseinfoUrl = ' '}

				// var app_author = $(this).find('.media-auther').text().trim();
				// if (app_author == '') { app_author = ' '}

				// var simple_item = [rankNum, app_title, app_author, baseinfoUrl]
				var simple_item = [rankNum, baseinfoUrl]
				news_item.push(simple_item)
			})
			i = i + 1;
			var nextLink = encodeURI('https://aso100.com/search/searchAndroidMore?page='+ i + '&search=狼人杀&date=2017-05-23');
			// var nextLink = encodeURI('https://aso100.com/search/searchMore?page='+ i + '&device=iphone&search=狼人杀&country=cn&brand_id=1&kdate=2017-05-23&ydate=2017-05-22')
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
					savedContent(news_item, filename);
				}, 3000)
			}
		})
	}).on('error', function(err) {
		console.log(err);
	})
}

// 保存数据
function savedContent(news_item, filename) {
	var x = '';
	console.log('filename', filename)
	var count = 0;
	var baseData = news_item;
	var len = baseData.length;
	var baseTitle,author,bundleId;
	// 获取基础信息
	getBaseInfo(baseData[count][1])
}

// 获取基础信息
function getBaseInfo(detailsUrl) {
	https.get(detailsUrl, function(res) {
		var baseinfo = '';
		res.setEncoding('utf-8');
		res.on('data', function(chunk) {
			baseinfo += chunk;
		})
		res.on('end', function() {
			var $$ = cheerio.load(baseinfo);
			baseTitle = $$('.container-appinfo').find('.appinfo-title').text().trim();
			if (baseTitle == '') { baseTitle = ' '}

			author = $$('.container-appinfo').find('.appinfo-auther').eq(0).find('.content').text().trim();
			if (author == '') { author = ' '}

			bundleId = $$('.container-appinfo').find('.appinfo-auther').eq(1).find('.content').text().trim();
			if (bundleId == '') { bundleId = ' '}

			// console.log('baseinfo', baseinfo)
			console.log('baseTitle', baseTitle)
			console.log('author', author)
			console.log('bundleId', bundleId)
			baseData[count].push(baseTitle, author, bundleId)
			
			// 'https://aso100.com/andapp/downTotal/appid/3387630?_pjax=#container'
			var downTotalUrl = encodeURI(baseData[count][1].replace(/baseinfo/, 'downTotal') + '?_pjax=#container');
			console.log('downTotalUrl', downTotalUrl)

			setTimeout(function(){
				// 获取下载量
				getDownTotal(downTotalUrl)
			}, 5000)
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
			totalNum = $$$('.table.rank').find('.rank span').text().trim();
			if (totalNum == '') { totalNum = ' '}

			console.log('totalNum', totalNum)
			baseData[count].push(totalNum)
			if (count < 0) {
				count++;
				// 10秒执行一次
				setTimeout(function(){
					getBaseInfo(baseData[count][1])
				}, 10000)
			} else {
				// 写下数据了
				console.log('写进html了')
				x += '<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"></head><body>'
				x += JSON.stringify(baseData)
				x += '</body></html>'
				fs.writeFile('./langrensha/'+ filename + '.html', x, 'utf-8', function(err) {
					if (err) {
						console.log(err);
					}
				})
				writeToexcel(baseData);
			}
		})
	})
}

// 写进excel文件
function writeToexcel(resData) {
	// var obj = xlsx.parse(__dirname + '/paiqi.xlsx');
	// var excelObj = obj[0].data;
	// console.log(excelObj);
	console.log('resData = ', resData)
	for (var i = 0; i < resData.length; i++) {
		resData[i].splice(1,1)
	}
	var dataTitle = ['序号', '产品名称', '公司', 'bundleID',  '下载量' ]
	resData.unshift(dataTitle);
	console.log(resData)

	var buffer = xlsx.build([
	    {
	        name:'sheet1',
	        data:resData
	    }        
	]);
	console.log('写进excel了')
	//将文件内容插入新的文件中
	fs.writeFileSync('langrensha.xlsx',buffer,{'flag':'w'});
}

fetchPage(androidurl, 'android-langrensha');
// fetchPage(iosurl, 'ios-langrensha');




