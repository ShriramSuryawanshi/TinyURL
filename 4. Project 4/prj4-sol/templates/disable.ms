
<!DOCTYPE html>
<html lang="en">
  <head>
    <title>URL Deactivate</title>
    <link rel="stylesheet" href="/css/style.css">
  </head>
  <body>
    <h1>URL Deactivate</h1>
    <span class="error">{{#serror}}{{serror}}{{/serror}}</span>
    <form method="POST" action="url-deactivate.html">
      <p>
        <label for="url">URL</label>
        <input type="url" id="url" name="url" value={{#url}}{{url}}{{/url}}>
        <span class="error">{{#error}}{{error}}{{/error}}</span>
      </p>
      <p><button type="submit">Deactivate URL</button></p>
    </form>
    <p class="result"> {{#result}}<div> {{{result}}} {{/result}} </div>
<footer class="footer">
  <ul>
    <li><a href="text-translate.html">Translate Text</a></li>
    <li><a href="url-info.html">URL Information</a></li>
    <li><a href="url-deactivate.html">Deactivate URL</a></li>
  </ul>
</footer>
  </body>
</html>
