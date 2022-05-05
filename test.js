$(function () {
    $.get('/proxy.txt', function (data) {
       words = data.split('\s');
    });
});