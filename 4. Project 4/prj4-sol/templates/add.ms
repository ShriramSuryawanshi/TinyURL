<!DOCTYPE html>
<html lang="en">
  <head>
    <title>Shorten Text</title>
    <link rel="stylesheet" href="/css/style.css">
  </head>
  <body>
       <script>
    if ( window.history.replaceState ) {
        window.history.replaceState( null, null, window.location.href );
    }
</script>
    <h1>Shorten Text</h1>
    <span class="error">{{#serror}}{{serror}}{{/serror}}</span>
    <form method="POST" action="text-translate.html">
      <p>
      <label for="text">Text</label>
      <textarea id="text" name="text" cols="80" rows="10">
      {{#text}}{{text}}{{/text}}
      </textarea>
      <span class="error">{{#error}}{{error}}{{/error}}</span>
      </p>
      <p><button type="submit">Shorten Text</button></p>
    </label>
    </form>
    <p class="result"> {{#result}}<div> {{{result}}} {{/result}} </div>
<footer class="footer">
  <ul>
    <li><a href="text-translate.html">Translate Text</a></li>
    <li><a href="url-info.html">URL Information</a></li>
    <li><a href="url-deactivate.html">Deactivate URL</a></li>
  </ul>
</footer>
</script>
  </body>
</html>
