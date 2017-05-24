var https = require('https');
var fs = require('fs');
var xlsx = require('node-xlsx');

var obj = xlsx.parse(__dirname + '/paiqi.xlsx');
var excelObj = obj[0].data;
console.log(excelObj);

var data = [
	['序号', 'bundleID', '产品名称', '下载量', '开发厂商', '公司']
];
// for(var i in excelObj){
//     var arr=[];
//     var val = excelObj[i];
//     for(var j in val){
//         arr.push(val[j]);
//     }
//     data.push(arr);
// }
var buffer = xlsx.build([
    {
        name:'sheet1',
        data:data
    }        
]);

//将文件内容插入新的文件中
fs.writeFileSync('test3.xlsx',buffer,{'flag':'w'});