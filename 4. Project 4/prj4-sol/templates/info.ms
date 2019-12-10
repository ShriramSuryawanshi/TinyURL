
<!DOCTYPE html>
<html lang="en">
  <head>
    <title>URL Info</title>
    <link rel="stylesheet" href="/css/style.css">
  </head>
  <body>
    <h1>URL Info</h1>
    <span class="error">{{#serror}}{{serror}}{{/serror}}</span>
    <form method="GET" action="url-info.html">
      <input type="hidden" name="isSubmit" value="true">
      <p>
        <label for="url">URL</label>
        <input type="url" id="url" name="url" value={{#url}}{{url}}{{/url}}>
        <span class="error">{{#error}}{{error}}{{/error}}</span>
      </p>
      <p><button class="submit" type="submit">Get URL Info</button></p>
    </form>
   {{#result}}
    <dl class="result">
         <dt>Short Url</dt><dd class="url">{{longUrl}}</dd>
         <dt>Long Url</dt><dd class="url">{{shortUrl}}</dd>
         <dt>Count</dt><dd>{{count}}</dd>
         <dt>Active Status</dt><dd>{{isActive}}</dd>
       </dl>
       {{/result}}
<footer class="footer">
  <ul>
    <li><a href="text-translate.html">Translate Text</a></li>
    <li><a href="url-info.html">URL Information</a></li>
    <li><a href="url-deactivate.html">Deactivate URL</a></li>
  </ul>
</footer>
  </body>
</html>
