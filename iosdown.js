var http = require('http');
var https = require('https');
var fs = require('fs');
var cheerio = require('cheerio');
var request = require('request');
var xlsx = require('node-xlsx');
var i = 1;
var news_item = [];

// 安卓基本信息
var androidBase = encodeURI('https://aso100.com/andapp/baseinfo/appid/2232458')
// 安卓总下载量
var androidDown = encodeURI('https://aso100.com/andapp/downTotal/appid/2232458')

var androidurl = encodeURI('https://aso100.com/search/searchAndroidMore?page=1&search=狼人杀&date=2017-05-23')

var iosurl= encodeURI('https://aso100.com/search/searchMore?page=1&device=iphone&search=狼人杀&country=cn&brand_id=1&kdate=2017-05-23&ydate=2017-05-22')
// 根据页数获取数据
function fetchPage(url, filename) {
	startRequest(url, filename);
}

function startRequest(url, filename) {
	console.log('lurl = ', url)
	https.get(url, function(res) {
		var html = '';
		res.setEncoding('utf-8');
		res.on('data', function(chunk) {
			html += chunk;
		})
		res.on('end', function() {
			var $ = cheerio.load(html);
			$('.media').each(function(){
				// var app_title = $(this).find('.media-heading a').text().trim();
				// var app_author = $(this).find('.media-auther').text().trim();
				var detailsUrl = 'https://aso100.com' + $(this).find('.media-heading a').attr('href')
				var downTotalUrl = detailsUrl.replace(/baseinfo/, 'downTotal');

				var baseTitle = '';
				var author = '';
				var bundleId = '';
				var totalNum = '';

				// setTimeout(function(){
					// 获取基本信息
					https.get(detailsUrl, function(res) {
						var baseinfo = '';
						res.setEncoding('utf-8');
						res.on('data', function(chunk) {
							baseinfo += chunk;
						})
						res.on('end', function() {
							var $$ = cheerio.load(baseinfo);
							baseTitle = $$('.container-appinfo').find('.appinfo-title').text().trim();
							author = $$('.container-appinfo').find('.appinfo-auther')[0].find('.content').text().trim();
							bundleId = $$('.container-appinfo').find('.appinfo-auther')[1].find('.content').text().trim();
						})
					})
					// 获取下载量
					https.get(downTotalUrl, function(res) {
						var downTotalNum = '';
						res.setEncoding('utf-8');
						res.on('data', function(chunk) {
							downTotalNum += chunk;
						})
						res.on('end', function() {
							var $$$ = cheerio.load(downTotalNum);
							totalNum = $$$('.container-down-total').find('.rank span').text().trim();
						})
					})
					var simple_item = [baseTitle, author, bundleId, totalNum];
					news_item.push(simple_item)
				// }, 10000)
			})
			i = i + 1;
			// var nextLink = 'https://aso100.com/search/searchAndroidMore?page='+ i + '&search=狼人杀&date=2017-05-23';
			// var nextLink = 'https://aso100.com/search/searchMore?page='+ i + '&device=iphone&search=狼人杀&country=cn&brand_id=1&kdate=2017-05-23&ydate=2017-05-22'
			// str = encodeURI(nextLink);
			console.log('news_item = ',news_item)
			if (i <= 0) {
				console.log('下一次')
				setTimeout(function(){
					fetchPage(str);
				}, 10000)
			} else {
				savedContent(news_item, filename);
			}
		})
	}).on('error', function(err) {
		console.log(err);
	})
}

function savedContent(msg, filename) {
	var x = '';
	for (var i = 0; i < msg.length; i++) {
		x += 'title: ' + msg[i]['title'] + '   author: ' + msg[i]['author'] + '\n';
	}
	fs.writeFile('./langrensha/'+ filename + '.txt', x, 'utf-8', function(err) {
		if (err) {
			console.log(err);
		}
	})
}

fetchPage(androidurl, 'android-langrensha');
// fetchPage(iosurl, 'ios-langrensha');




