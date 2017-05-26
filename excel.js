var https = require('https');
var fs = require('fs');
var xlsx = require('node-xlsx');

// 先获取
// var obj = xlsx.parse(__dirname + '/paiqi.xlsx');
// var excelObj = obj[0].data;
// console.log(excelObj);


var tcount = 0;


// var data = [
// 	['序号', 'bundleID', '产品名称', '下载量', '开发厂商', '公司'],
// 	['序号', 'bundleID', '产品名称', '下载量', null, null, '公司']
// ];

var finalArr = [];
function writeToexcel() {
	tcount++;
	var tArr = ['序号', 'bundleID', '产品名称', '下载量', '开发厂商', '公司' + tcount]
	finalArr.push(tArr)
	var buffer = xlsx.build([
	    {
	        name:'sheet1',
	        data:finalArr
	    }        
	]);
	//将文件内容插入新的文件中
	fs.writeFileSync('test3.xlsx',buffer,{flag: 'w'});
	fs.writeFileSync('test3-back.xlsx',buffer,{flag: 'w'});
	console.log('第'+ (tcount) +'条数据写进excel了' + '\n')
	setTimeout(function(){
		writeToexcel()
	}, 500)
}
writeToexcel()



