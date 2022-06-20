// s regex flag doesn't work, replaced . with [^]
// https://stackoverflow.com/questions/159118/how-do-i-match-any-character-across-multiple-lines-in-a-regular-expression#comment50725395_159139

const SHLScrape = {};

SHLScrape.baseURL = 'https://simulationhockey.com';

SHLScrape.makeURL = function (path = [], params = {}) {
  let pathStr = path.join('/');
  let variablesArr = [];
  for (let param in params) {
    let value = params[param];
    variablesArr.push(`${param}=${value}`);
  }
  let variablesStr = variablesArr.join('&');
  let extras = [pathStr, variablesStr].join('?');
  return [this.baseURL, extras].join('/');
}

SHLScrape.getUrlContentText = function (url, force = false) {
  // const retries = 5;
  if (Array.isArray(url)) {
    return url.map(u => SHLScrape.getUrlContentText(u, force));
  } else {
    let response;
    try {
      response = force ? null : BatchProcess.retrieveFromBatches(url, 'cache', 'script');
      if (response) return response; // return cache if available
    } catch (e) { } // ignore cache if error with retrieval
    do {
      response = UrlFetchApp.fetch(url, { muteHttpExceptions: true });
    } while (response.getResponseCode() !== 200);
    BatchProcess.saveInBatches(url, response.getContentText(), 'cache', 'script');
    // CacheService.getScriptCache().put(url, response.getContentText()); // cache text for 10 minutes (default)
    return response.getContentText();
  }
}

SHLScrape.decodeHTMLEntities = function (input) {
  var decode = XmlService.parse('<d>' + input + '</d>');
  return decode.getRootElement().getText();
}

function findNewUsers() {
  const blanksBeforeQuitting = 20;

  let ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName('users');
  let range = sheet.getRange(sheet.getMaxRows(), 1, 1, 2);

  let uid = range.getValue();
  let blanks = 0;
  while (true) {
    uid++;
    let userPageContent = SHLScrape.getUrlContentText(SHLScrape.makeURL(['member.php'], { action: 'profile', uid: uid }));
    userPageContent = userPageContent.replace(/\n/g, '');
    userPageContent = userPageContent.replace(/\s\s+/g, ' ');
    try {
      let name = Util.decodeHTMLEntities(userPageContent.match(/<div id="one">.*?>([^<].*?)<\//)[1]);
      range = range.offset(1, 0);
      range.setValues([[uid, name]]);
      blanks = 0;
      Logger.log(uid + ': ' + name);
    } catch (e) {
      blanks++;
      Logger.log(uid + ': ' + e.message);
    }
    if (blanks >= blanksBeforeQuitting) break;
  }
}

function maintainUsers() {
  let ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName('users') || ss.insertSheet('users', ss.getNumSheets());

  let users = JSON.parse(SHLScrape.getUrlContentText('https://cards.simulationhockey.com/api/v2/users', true));
  users = users.sort((a, b) => a.uid - b.uid).map(u => [u.uid, u.username]);
  Util.addArrayToSheet(sheet.getRange(1, 1), users);

  // // trim cells of sheet (leaving 2 columns and 1 row minimum)
  // let empty;
  // // right
  // empty = sheet.getMaxColumns() - Math.max(2, sheet.getLastColumn());
  // if (empty > 0) sheet.deleteColumns(sheet.getLastColumn() + 1, empty);
  // // left
  // empty = sheet.getDataRange().getColumn() - 1;
  // if (empty > 0) sheet.deleteColumns(1, empty);
  // // bottom
  // empty = sheet.getMaxRows() - Math.max(1, sheet.getLastRow());
  // if (empty > 0) sheet.deleteRows(sheet.getLastRow() + 1, empty);
  // // top
  // empty = sheet.getDataRange().getRow() - 1;
  // if (empty > 0) sheet.deleteRow(1, empty);
  // // ensure 2 columns
  // let range = sheet.getRange('A1:B1');
  // range.setValues(range.getValues());

  // // get, or define, named ranges
  // let uidRange = ss.getRangeByName('TestUserIds');
  // if (!uidRange) {
  //   uidRange = sheet.getRange('A:A');
  //   ss.setNamedRange('TestUserIds', uidRange);
  // }
  // let usernameRange = ss.getRangeByName('TestUserNames');
  // if (!usernameRange) {
  //   usernameRange = sheet.getRange('B:B');
  //   ss.setNamedRange('TestUserNames', usernameRange);
  // }



  return;
  range = sheet.getRange('A:B')

  let uids = range.getValues().map(row => row[0]);
  results = [];
  for (let i in uids) {
    let userPageContent = SHLScrape.getUrlContentText(SHLScrape.makeURL(['member.php'], { action: 'profile', uid: uids[i] }));
    userPageContent = userPageContent.replace(/\n/g, '');
    userPageContent = userPageContent.replace(/\s\s+/g, ' ');
    try {
      let name = Util.decodeHTMLEntities(userPageContent.match(/<div id="one">.*?>([^<].*?)<\//)[1]);
      // results.push([name]);
      range.offset(i, 1, 1, 1).setValue(name);
      Logger.log(uids[i] + ': ' + name);
    } catch (e) {
      Logger.log('doesn\'t exist');
    }
  }
  // Util.addArrayToSheet(range.offset(0, 1), results);
}

function scrapeTest() {
  let bt = SHLScrape.transaction(23653);
  Logger.log(bt);
  const activityWeek = function (date) {
    return 1;
  }
  return;

  // let values = SpreadsheetApp.getActiveSheet().getRange('A:A').getValues();
  // let last = 0;
  // let maxGap = 0;
  // for (let row in values) {
  //   maxGap = Math.max(maxGap, values[row][0] - last);
  //   Logger.log(maxGap + ', ' + last);
  //   last = values[row][0];
  // }
  // return;
  // SHLScrape.post(3172111).show();
  // return;

  // Logger.log(SHLScrape.topic(122147).posts.map(p => p.postId));
  // Util.addArrayToSheet(SpreadsheetApp.getActiveRange(), SHLScrape.forum(520).topics.map(t => [t.topicId, t.title]));
  // let urls = []
  // for (let page = 1; page <= 19; page++) {
  //   urls.push('https://simulationhockey.com/forumdisplay.php?fid=43&page=' + page);
  // }
  // let requests = UrlFetchApp.fetchAll(urls);
  // Logger.log(SHLScrape.getUrlContentText(urls).map(c => c.match(/<span class="pagination_current">(\d+)<\/span>/)[1]));;
  // let range = SpreadsheetApp.getActiveRange();
  // // let pids = range.getValues()[0];
  // let results = [];
  // let topic = SHLScrape.topic(119590);
  // for (let post of topic.posts) {
  //   results.push([post.username + '@1']);
  // }
  // // for (let dcol in pids) {
  // //   let post = SHLScrape.post(pids[dcol]);
  // //   results.push(post.contents);
  // //   Logger.log(post.postId);
  // // }
  // Util.addArrayToSheet(range.offset(0, 0), results);

  // let range = SpreadsheetApp.getActiveRange();
  // let values = range.getValues();
  // for (let row in values) {
  //   for (let col in values[row]) {
  //     values[row][col] = Util.decodeHTMLEntities(values[row][col]);
  //   }
  // }
  // range.setValues(values);

  let range = SpreadsheetApp.getActiveRange();
  // let tids = range.getValues()[0];
  // let results = [];
  // for (let i in tids) {
  //   let topic = SHLScrape.topic(tids[i]);
  //   results.push(topic.title.match(/\d+/)[1]);
  //   Logger.log(topic.title);
  // }
  // Util.addArrayToSheet(range.offset(1, 0), [results]);
  // return;

  let uids = range.getValues().map(row => row[0]);
  results = [];
  for (let i in uids) {
    let userPageContent = SHLScrape.getUrlContentText(SHLScrape.makeURL(['member.php'], { action: 'profile', uid: uids[i] }));
    userPageContent = userPageContent.replace(/\n/g, '');
    userPageContent = userPageContent.replace(/\s\s+/g, ' ');
    try {
      let name = Util.decodeHTMLEntities(userPageContent.match(/<div id="one">.*?>([^<].*?)<\//)[1]);
      // results.push([name]);
      range.offset(i, 1, 1, 1).setValue(name);
      Logger.log(uids[i] + ': ' + name);
    } catch (e) {
      Logger.log('doesn\'t exist');
    }
  }
  // Util.addArrayToSheet(range.offset(0, 1), results);
}

SHLScrape.forum = function (fid) {
  const linksRegex = /<a[^>]*href[^=]*=[^"]*"(?<href>[^"]*)"[^>]*>(?<content>[^<]*)<\/a[^>]*>/g;
  const navigationRegex = /<div class="navigation">(?<content>[^]*?)<\/div>/;
  const nextPageRegex = /<a[^>]*href="[^"]*page=(?<nextPage>\d*)[^"]*"[^>]*class="pagination_next"[^>]*>[^<]*<\/a[^>]*>/;
  const pageNumbersRegex = /<a[^>]*href="[^"]*page=(?<page>\d+)[^>]*class="pagination_[^>]*>/g;
  const forumSubforumRegex = /(?<=Forums in [^]*)(?<!pagination[^]*)<tr>([^]*?)<\/tr>/g;
  // const forumTopicsRegex = /<tr class="inline_row">([^]*?)<\/tr>/g;
  const forumImportantTopicRegex = /(?<=Important Threads[^]*)(?<!Normal Threads[^]*)<tr[^>]*?class="inline_row"[^>]*>([^]*?)<\/tr>/g;
  const forumNormalTopicRegex = /(?:(?<=Normal Threads[^]*)|(?<!Important Threads[^]*))<tr[^>]*?class="inline_row"[^>]*>([^]*?)<\/tr>/g;

  let results = {};

  let nextPage = 1;
  const nextUrl = () => this.makeURL(['forumdisplay.php'], { fid: fid, page: nextPage });
  let content = SHLScrape.getUrlContentText(nextUrl());

  // ************************************************** //
  // on first page, extract forum-specific information
  // ************************************************** //

  // get forum path to current forum
  let navigationContent = content.match(navigationRegex).groups.content;
  results.navigation = [];
  for (let match of navigationContent.matchAll(linksRegex)) {
    let { href, content } = match.groups;
    // correct relative links
    if (!href.includes(this.baseURL)) {
      href = `${this.baseURL}/${href}`;
    }
    content = content.trim();
    results.navigation.unshift({ href, content });
  }
  // title is the first content of the navigation heirarchy
  results.title = results.navigation[0].content;
  // get names of and links to moderators

  // process sub forums (first page only, other pages have identical info)
  results.subforums = [];
  let forumSubforums = content.matchAll(forumSubforumRegex);
  for (let match of forumSubforums) {
    results.subforums.push(this.parseForumSubforum(match[1]));
  }

  // get number of pages
  let pageNumbers = Array.from(content.matchAll(pageNumbersRegex)).map(m => parseInt(m?.groups?.page || 1));
  results.pages = Math.max(...pageNumbers);

  // ************************************************** //
  // loop through pages and parse subforums and topics
  // ************************************************** //

  results.topics = [];
  do {
    // process important topics then normal topics
    let forumImportantTopics = content.matchAll(forumImportantTopicRegex);
    let forumNormalTopics = content.matchAll(forumNormalTopicRegex);
    for (let match of forumImportantTopics) {
      let topic = this.parseForumTopic(match[1]);
      topic.status = 'Important';
      topic.forumPage = nextPage; // current page
      results.topics.push(topic);
    }
    for (let match of forumNormalTopics) {
      let topic = this.parseForumTopic(match[1]);
      topic.status = 'Normal';
      topic.forumPage = nextPage; // current page
      results.topics.push(topic);
    }

    // get next page content if applicable
    nextPage = content.match(nextPageRegex)?.groups?.nextPage;
    if (nextPage) content = SHLScrape.getUrlContentText(nextUrl());
  } while (nextPage != null)

  return results;
}

SHLScrape.parseForumSubforum = function (forumSubforum) {
  const linksRegex = /<a[^>]*href[^=]*=[^"]*"(?<href>[^"]*)"[^>]*>(?<content>[^<]*)<\/a[^>]*>/g;
  const subforumItemRegexes = {
    forumID: /fid=(\d+)/,
    title: /<span[^>]*class="[^"]*subject[^>]*>[^<]*<a[^>]*>([^<]*)<\/a[^>]*>/,
    banner: /(?<=<span class="hide htc">[^]*?)<img[^>]*src="([^"]*)"[^>]*>/,
    // note: /<small>([^]*?)<\/small>/,
    subforums: /(?<=<div class="subf">[^]*?)(?<!<\/li><\/div>[^]*?)<a[^>]*?fid=(?<fid>\d+)[^>]*?>(?<title>[^<]*?)</g,
    // topics
    // replies
  };
  // const replacementArrays = [
  //   [/<div class="codeblock">[^]*?(?:<\/div>[^]*?){3}/g, ' '], // get rid of code blocks
  //   [/<img[^>]*?title="([^"]*?)" class="smilie[^>]*?>/g, ':$1:'], // replace smilie's with their code
  //   // [/<img[^>]*?src="([^"].*?\/smilies\/[^"].*?)"[^>]*?>/g, '[img]$1[/img]'], // replace smilie images with bbcode
  //   [/<img.*?src="(.*?)".*?>/g, '[img]$1[/img]'], // replace images with bbcode
  //   [/<a.*?href="(.*?)".*?>(.*?)<\/a>/g, '[url=$1]$2[/url]'], // replace links with bbcode
  //   [/\<.*?\>/g, ' '], // get rid of tags
  //   [/\n/g, ' '], // get rid of new lines
  //   [/\s\s+/g, ' '], // trim whitespace
  // ];

  let subforum = {};
  for (let key in subforumItemRegexes) {
    try {
      let matchGroup = forumSubforum.match(subforumItemRegexes[key])[1];
      // for (r in replacementArrays) {
      //   matchGroup = matchGroup.replaceAll(...replacementArrays[r]).trim();
      // }
      subforum[key] = Util.decodeHTMLEntities(matchGroup).trim();
    }
    catch (e) {
      subforum[key] = '';
    }
  }
  return subforum;
};

SHLScrape.parseForumTopic = function (forumTopic) {
  const linksRegex = /<a[^>]*href[^=]*=[^"]*"(?<href>[^"]*)"[^>]*>(?<content>[^<]*)<\/a[^>]*>/g;
  const topicItemRegexes = {
    topicId: /id="tid_(\d*)"/,
    title: /<span[^>]*class="[^"]*subject[^>]*>[^<]*<a[^>]*>([^<]*)<\/a[^>]*>/,
    note: /<small>([^]*?)<\/small>/,
    author: /<div[^>]*class="author[^>]*>[^]*?<a[^>]*href[^=]*=[^"]*"[^"]*"[^>]*>([^<]*)<\/a[^>]*>/,
    authorUrl: /<div[^>]*class="author[^>]*>[^]*?<a[^>]*href[^=]*=[^"]*"([^"]*)"[^>]*>[^<]*<\/a[^>]*>/,
    authorUid: /<div[^>]*class="author[^]*?uid=(\d+)/,
    // pages
    // replies
    // views
    // last post date & time
  };
  // const replacementArrays = [
  //   [/<div class="codeblock">[^]*?(?:<\/div>[^]*?){3}/g, ' '], // get rid of code blocks
  //   [/<img[^>]*?title="([^"]*?)" class="smilie[^>]*?>/g, ':$1:'], // replace smilie's with their code
  //   // [/<img[^>]*?src="([^"].*?\/smilies\/[^"].*?)"[^>]*?>/g, '[img]$1[/img]'], // replace smilie images with bbcode
  //   [/<img.*?src="(.*?)".*?>/g, '[img]$1[/img]'], // replace images with bbcode
  //   [/<a.*?href="(.*?)".*?>(.*?)<\/a>/g, '[url=$1]$2[/url]'], // replace links with bbcode
  //   [/\<.*?\>/g, ' '], // get rid of tags
  //   [/\n/g, ' '], // get rid of new lines
  //   [/\s\s+/g, ' '], // trim whitespace
  // ];

  let topic = {};
  for (let key in topicItemRegexes) {
    try {
      let matchGroup = forumTopic.match(topicItemRegexes[key])[1];
      // for (r in replacementArrays) {
      //   matchGroup = matchGroup.replaceAll(...replacementArrays[r]).trim();
      // }
      topic[key] = Util.decodeHTMLEntities(matchGroup).trim();
    }
    catch (e) {
      topic[key] = e.message;
    }
  }
  return topic;
};

SHLScrape.topic = function (tid) {
  const linksRegex = /<a[^>]*href[^=]*=[^"]*"(?<href>[^"]*)"[^>]*>(?<content>[^<]*)<\/a[^>]*>/g;
  const navigationRegex = /<div class="navigation">(?<content>[^]*?)<\/div>/;
  const nextPageRegex = /<a[^>]*href="[^"]*page=(?<nextPage>\d*)[^"]*"[^>]*class="pagination_next"[^>]*>[^<]*<\/a[^>]*>/;
  const pageNumbersRegex = /<a[^>]*href="[^"]*page=(?<page>\d+)[^>]*class="pagination_[^>]*>/g;
  const topicPostRegex = /(<a name="pid[^]*?)<div class="post_controls"/g;

  let results = {};

  let nextPage = 1;
  const nextUrl = () => this.makeURL(['showthread.php'], { tid: tid, page: nextPage });
  let content = SHLScrape.getUrlContentText(nextUrl());

  // ************************************************** //
  // on first page, extract topic-specific information
  // ************************************************** //

  // get forum path to current topic
  let navigationContent = content.match(navigationRegex).groups.content;
  results.navigation = [];
  for (let match of navigationContent.matchAll(linksRegex)) {
    let { href, content } = match.groups;
    // correct relative links
    if (!href.includes(this.baseURL)) {
      href = `${this.baseURL}/${href}`;
    }
    content = content.trim();
    results.navigation.unshift({ href, content });
  }
  // title is the first content of the navigation heirarchy
  results.title = results.navigation[0].content;

  // get number of pages
  let pageNumbers = Array.from(content.matchAll(pageNumbersRegex)).map(m => parseInt(m?.groups?.page || 1));
  results.pages = Math.max(...pageNumbers);

  // ************************************************** //
  // loop through pages and parse posts
  // ************************************************** //

  results.posts = [];
  do {
    // process posts (first page already loaded)
    let topicPosts = content.matchAll(topicPostRegex);
    for (let match of topicPosts) {
      results.posts.push(this.parseTopicPost(match[1]));
    }

    // get next page content if applicable
    nextPage = content.match(nextPageRegex)?.groups?.nextPage;
    if (nextPage) content = SHLScrape.getUrlContentText(nextUrl());
  } while (nextPage != null)

  return results;
}

SHLScrape.parseTopicPost = function (topicPost, opts = {}) {
  const postItemRegexes = {
    postId: /id="pid(\d*)"/,
    topicId: /tid=(\d*)/,
    postNum: /<a[^>]*>#(\d*)<\/a[^>]*>/,
    postDate: /post_date[^]*?(\d{2}-\d{2}-\d{4})/,
    postTime: /post_date[^]*?(\d{2}:\d{2} .M)/,
    editDate: /edited_post[^]*?(\d{2}-\d{2}-\d{4})(?=[^]*?post_body)/,
    editTime: /edited_post[^]*?(\d{2}:\d{2} .M)(?=[^]*?post_body)/,
    username: /profile-username">[^]*?>([^<]+)</,
    authorUid: /profile-username">[^]*?uid=(\d+)/,
    contents: /<div[^>]*class="[^"]*post_body[^"]*"[^>]*?>([^]*?)<div[^>]*class="(?:hide|post_meta)"[^>]*>/,
    signature: /<div[^>]*class="[^"]*signature[^"]*"[^>]*?>([^]*?)<div[^>]*class="post_meta"[^>]*>/,
  };
  const replacementArrays = [
    [/&nbsp;/g, ' '], // replace &nbsp; entities
    [String.fromCharCode(160), ' '], // 
    // [/<div class="codeblock">[^]*?(?:<\/div>[^]*?){3}/g, ' '], // get rid of code blocks
    [/<img[^>]*?title="([^"]*?)" class="smilie[^>]*?>/g, ':$1:'], // replace smilie's with their code
    [/<img[^>]*?src="([^"].*?\/smilies\/[^"].*?)"[^>]*?>/g, '[img]$1[/img]'], // replace smilie images with bbcode
    [/<img.*?src="(.*?)".*?>/g, '[img]$1[/img]'], // replace images with bbcode
    [/<a.*?href="(.*?)".*?>(.*?)<\/a>/g, '[url=$1]$2[/url]'], // replace links with bbcode
    [/\<.*?\>/g, ' '], // get rid of tags
    [(opts.newLines ? / /g : /\n/g), ' '], // get rid of new lines
    [(opts.whiteSpace ? / /g : /\s\s+/g), ' '], // trim whitespace
  ];

  let post = {};
  for (let key in postItemRegexes) {
    try {
      let matchGroup = topicPost.match(postItemRegexes[key])[1];
      if (key == 'contents') {
        for (r in replacementArrays) {
          matchGroup = matchGroup.replaceAll(...replacementArrays[r]).trim();
        }
      }
      post[key] = Util.decodeHTMLEntities(matchGroup).trim();
    }
    catch (e) {
      post[key] = '';
    }
  }
  return post;
};

SHLScrape.post = function (pid, opts = {}) {
  const topicPostRegex = new RegExp(`(<a name="pid${pid}[^]*?)<div class="post_controls"`);

  let results = {};

  const url = this.makeURL(['showthread.php'], { pid: pid });
  let content = SHLScrape.getUrlContentText(url);

  // tailor html to bare post
  results.htmlText = content;
  let replacements = [
    [`(<div[^>]*id="post_${pid}"[^>]*>[^]*?)<div[^>]*class="post_controls"[^>]*>[^]*?<\/div>[^]*?(<style>[^]*?<\/style>[^]*?<\/style>)`, '$1$2'],
    [`(<div id="posts">)[^]*?(<div[^>]*id="post_${pid}"[^>]*>[^]*?<style>[^]*?<\/style>[^]*?<\/style>)`, '$1$2'],
    [`(<div id="posts">)[^]*?(<div[^>]*id="post_${pid}"[^>]*>[^]*?<style>[^]*?<\/style>[^]*?<\/style>)[^]*<\/style>([^<]*<\/div>)`, '$1$2$3'],
    ['<tr>[^<]*<td class="tfoot">[^]*?<\/tr>', ''],
    ['(<div class="wrapper">)[^]*?(<table[^>]*>[^]*?<\/table>)[^]*?<\/table>[^]*?(<\/div>)', '$1$2$3'],
    ['(<div class="wrapper">)[^]*?(<table[^>]*>[^]*?<\/table>)[^]*?<\/table>[^]*?(<\/div>)', '$1$2$3'],
    ['(<body>)[^]*?(<div id="mainwidth">)[^]*?(<div class="container">)', '$1$2$3']
  ];
  replacements.forEach(r => results.htmlText = results.htmlText.replace(new RegExp(r[0]), r[1]));
  results.show = function () {
    let html = HtmlService
      .createHtmlOutput(this.htmlText)
      .setWidth(768)
      .setHeight(768);
    return SpreadsheetApp.getUi().showModelessDialog(html, `Post ID: ${pid}`);
  };

  let match = content.match(topicPostRegex);
  results = Object.assign(results, match ? this.parseTopicPost(match[1], opts) : {});
  return results;
}

SHLScrape.transaction = function (id) {
  const bankTransactionRegexes = {
    title: /<div[^>]*bojo[^>]*>[^]*?<h2>([^]*?)<\/h2>/,
    description: /<div[^>]*bojo[^>]*>[^]*?<p>([^]*?)<\/p>/,
    amount: /<div[^>]*bojo[^>]*>[^]*?<th>Amount<\/th>[^]*?<td[^>]*>([^]*?)<\/td>/,
    userBankURL: /<div[^>]*bojo[^>]*>[^]*?<th>User<\/th>[^]*?<td[^>]*>[^]*?href="([^]*?)"[^]*?<\/td>/,
    userId: /<div[^>]*bojo[^>]*>[^]*?<th>User<\/th>[^]*?<td[^>]*>[^]*?href="[^]*?(\d*)"[^]*?<\/td>/,
    username: /<div[^>]*bojo[^>]*>[^]*?<th>User<\/th>[^]*?<td[^>]*>[^]*?<a[^>]*>([^]*?)<\/a>[^]*?<\/td>/,
    creatorBankURL: /<div[^>]*bojo[^>]*>[^]*?<th>Made by<\/th>[^]*?<td[^>]*>[^]*?href="([^]*?)"[^]*?<\/td>/,
    creatorUid: /<div[^>]*bojo[^>]*>[^]*?<th>Made by<\/th>[^]*?<td[^>]*>[^]*?href="[^]*?(\d*)"[^]*?<\/td>/,
    creatorname: /<div[^>]*bojo[^>]*>[^]*?<th>Made by<\/th>[^]*?<td[^>]*>[^]*?<a[^>]*>([^]*?)<\/a>[^]*?<\/td>/,
    date: /<div[^>]*bojo[^>]*>[^]*?<th>Date<\/th>[^]*?<td[^>]*>([^]*?)<\/td>/,
    time: /<div[^>]*bojo[^>]*>[^]*?<th>Time<\/th>[^]*?<td[^>]*>([^]*?)<\/td>/,
    groupRequestURL: /<div[^>]*bojo[^>]*>[^]*?<th>Group<\/th>[^]*?<td[^>]*>[^]*?href="([^]*?)"[^]*?<\/td>/,
    groupRequestId: /<div[^>]*bojo[^>]*>[^]*?<th>Group<\/th>[^]*?<td[^>]*>[^]*?href="[^]*?(\d*)"[^]*?<\/td>/,
    groupname: /<div[^>]*bojo[^>]*>[^]*?<th>Group<\/th>[^]*?<td[^>]*>[^]*?<a[^>]*>([^]*?)<\/a>[^]*?<\/td>/,
    bankerBankURL: /<div[^>]*bojo[^>]*>[^]*?<th>Banker<\/th>[^]*?<td[^>]*>[^]*?href="([^]*?)"[^]*?<\/td>/,
    bankerUid: /<div[^>]*bojo[^>]*>[^]*?<th>Banker<\/th>[^]*?<td[^>]*>[^]*?href="[^]*?(\d*)"[^]*?<\/td>/,
    bankername: /<div[^>]*bojo[^>]*>[^]*?<th>Banker<\/th>[^]*?<td[^>]*>[^]*?<a[^>]*>([^]*?)<\/a>[^]*?<\/td>/,
  };

  let transaction = {
    id: id,
    url: SHLScrape.makeURL(['banktransaction.php'], { id: id }),
  };
  let content = SHLScrape.getUrlContentText(transaction.url);

  for (let key in bankTransactionRegexes) {
    try {
      let matchGroup = content.match(bankTransactionRegexes[key])[1];
      transaction[key] = Util.decodeHTMLEntities(matchGroup).trim();
      if (!isNaN(transaction[key])) transaction[key] = Number(transaction[key]);
    }
    catch (e) {
      // don't add attributes that are missing from transaction
    }
  }
  let date = transaction.date.match(/(\d+)\/(\d+)\/(\d+)/);
  let time = transaction.time.match(/(\d+):(\d+) (.)M (\w+)/);
  transaction.datetime = new Date(
    parseInt(date[3]) + 2000,
    parseInt(date[1]) - 1, // month index
    parseInt(date[2]),
    parseInt(time[1]) + (time[3] == 'P' ? 12 : 0),
    parseInt(time[2])
  );
  let millDiff = transaction.datetime.getTime() - (new Date(2014, 5 - 1 /*May index*/, 5)).getTime();
  transaction.activityWeek = Math.floor(millDiff / (1000 * 60 * 60 * 24 * 7)) + 1;
  return transaction;
}

SHLScrape.request = function (id) {
  const bankRequestRegexes = {
    name: /<div[^>]*bojo[^>]*>[^]*?<th>Group Name<\/th>[^]*?<td[^>]*>([^]*?)<\/td>/,
    requester: /<div[^>]*bojo[^>]*>[^]*?<th>Submitted By<\/th>[^]*?<td[^>]*>([^]*?)<\/td>/,
    requested: /<div[^>]*bojo[^>]*>[^]*?<th>Submitted Date<\/th>[^]*?<td[^>]*>([^]*?)<\/td>/,
    status: /<div[^>]*bojo[^>]*>[^]*?<th>Status<\/th>[^]*?<td[^>]*>([^]*?)<\/td>/,
    banker: /<div[^>]*bojo[^>]*>[^]*?<th>Decided By<\/th>[^]*?<td[^>]*>([^]*?)<\/td>/,
    decided: /<div[^>]*bojo[^>]*>[^]*?<th>Decision Date<\/th>[^]*?<td[^>]*>([^]*?)<\/td>/,
    memberRowsRaw: /<div[^>]*bojo[^>]*>[^]*?<th>User<\/th>[^]*?<\/tr[^>]*>([^]*?)<\/table>/,
  };

  let content = SHLScrape.getUrlContentText(this.makeURL(['bankrequest.php'], { id: id }));

  let request = { id: id };
  for (let key in bankRequestRegexes) {
    try {
      request[key] = content.match(bankRequestRegexes[key])[1];
      // if (!isNaN(request[key])) request[key] = Number(request[key]);
    }
    catch (e) {
      // don't add attributes that are missing from transaction
      request[key] = e.message;
    }
  }

  // ************************************************** //
  // loop through member rows
  // ************************************************** //
  // something screwing is going on with the scraping, it leaves out <tr> but not </tr>, couldn't find </tbody>
  let rows = request.memberRowsRaw.matchAll(/(?:^|<\/tr>)([^]*?)<\/tr>/g);
  request.members = [];
  for (let match of rows) {
    let member = {};
    member.url = match[1].match(/href="([^]*?)"/)[1];
    member.uid = member.url.match(/\d+/)[0];
    member.name = match[1].match(/<a[^>]*>([^]*?)<\/a>/)[1];
    member.amount = match[1].match(/<\/td><td[^>]*>([^]*?)<\/td>/)[1];
    member.description = match[1].match(/[^]*<td[^>]*>([^]*?)<\/td>$/)[1];
    request.members.push(member);
  }
  return request;
}

/**
 * @param {615} fid The forum id.
 * @param {"title", "author"} fields The topic fields to extract.
 * @return A 2D array of all fields for each topic in the forum.
 * @customfunction
 */
function SHLFORUMTOPICS(fid, ...fields) {
  return SHLScrape.forum(fid)?.topics.map(t => fields.map(f => t[f]));
}

function SHLTOPIC(tid, ...fields) {
  let topic = SHLScrape.topic(tid);
  return fields.map(f => topic[f]);
}

function SHLTOPICPOSTS(tid, ...fields) {
  return SHLScrape.topic(tid)?.posts.map(p => fields.map(f => p[f]));
}

function SHLPOST(pid, ...fields) {
  let post = SHLScrape.post(pid, { newLines: true, whiteSpace: true });
  return fields.map(f => post[f]);
}
