// ==UserScript==
// @name         Bangumi Comment Cleaner
// @namespace    https://github.com/Adachi-Git/BangumiCleaner
// @version      0.1
// @description  批量删除 Bangumi 上的回复
// @author       Adachi
// @match        https://*.bangumi.tv/group/my_reply
// @match        https://*.bgm.tv/group/my_reply
// @match        https://*.chii.in/group/my_reply
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    var totalTopicsVisited = 0;
    var totalRepliesDeleted = 0;

    // 获取请求头
    function getHeaders() {
        return {
            'Accept': '*/*',
            'Accept-Encoding': 'gzip, deflate, br',
            'Accept-Language': 'zh-CN,zh;q=0.9',
            'Connection': 'keep-alive',
            'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
            'Cookie': document.cookie,
            'Host': window.location.hostname,
            'Referer': window.location.href,
            'Sec-Fetch-Dest': 'empty',
            'Sec-Fetch-Mode': 'cors',
            'Sec-Fetch-Site': 'same-origin',
            'User-Agent': navigator.userAgent,
            'X-Requested-With': 'XMLHttpRequest'
        };
    }

    // 解析响应内容，提取删除链接
    function parseDeleteLinks(html) {
        var parser = new DOMParser();
        var doc = parser.parseFromString(html, 'text/html');
        var deleteLinks = doc.querySelectorAll('.erase_post');
        var deleteURLs = [];
        deleteLinks.forEach(function(link) {
            var deleteURL = link.getAttribute('href');
            console.log('删除链接:', deleteURL);
            deleteURLs.push(deleteURL);
        });
        return deleteURLs;
    }

    // 发送删除请求
    function sendDeleteRequests(deleteURLs) {
        return Promise.all(deleteURLs.map(function(deleteURL) {
            return fetch('https://' + window.location.hostname + deleteURL, {
                method: 'GET',
                headers: getHeaders(),
                credentials: 'same-origin'
            })
            .then(function(response) {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.text();
            });
        }));
    }

    // 创建按钮
    function createDeleteButton() {
        var button = document.createElement('button');
        button.textContent = '清空你的回复吧';
        button.style.position = 'fixed';
        button.style.top = '50%';
        button.style.left = '20px';
        button.style.transform = 'translateY(-50%)';
        button.addEventListener('click', function() {
            var confirmDelete = confirm('确定要批量删除所有回复吗？');
            if (confirmDelete) {
                // 获取所有话题链接
                var topicLinks = document.querySelectorAll('td.subject a');
                var topicURLs = [];

                // 提取话题链接
                topicLinks.forEach(function(link) {
                    var href = link.getAttribute('href');
                    if (href.startsWith('/group/topic/')) {
                        var topicURL = 'https://' + window.location.hostname + href;
                        topicURLs.push(topicURL);
                    }
                });

                // 访问每个话题的URL并获取响应
                Promise.all(topicURLs.map(function(topicURL) {
                    return fetch(topicURL, {
                        method: 'GET',
                        headers: getHeaders(),
                        credentials: 'same-origin'
                    })
                    .then(function(response) {
                        if (!response.ok) {
                            throw new Error('Network response was not ok');
                        }
                        return response.text();
                    })
                    .then(function(html) {
                        console.log('话题URL:', topicURL);
                        console.log('响应内容:', html);

                        // 记录访问的话题数量
                        totalTopicsVisited++;

                        // 解析响应内容，提取删除链接
                        var deleteURLs = parseDeleteLinks(html);
                        if (deleteURLs.length > 0) {
                            // 发送删除请求
                            return sendDeleteRequests(deleteURLs)
                                .then(function() {
                                    // 更新删除的回复数量
                                    totalRepliesDeleted += deleteURLs.length;
                                });
                        }
                    })
                    .catch(function(error) {
                        console.error('There has been a problem with your fetch operation:', error);
                    });
                })).then(function() {
                    alert('成功删除了 ' + totalRepliesDeleted + ' 个回复，共 ' + totalTopicsVisited + ' 个话题');
                });
            }
        });
        document.body.appendChild(button);
    }

    // 初始化
    createDeleteButton();

})();
