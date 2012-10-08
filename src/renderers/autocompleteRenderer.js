/**
 * Autocomplete renderer
 * @param {Object} instance Handsontable instance
 * @param {Element} td Table cell where to render
 * @param {Number} row
 * @param {Number} col
 * @param {String|Number} prop Row object property name
 * @param value Value to render (remember to escape unsafe HTML before inserting to DOM!)
 * @param {Object} renderOptions Render options
 */
Handsontable.AutocompleteRenderer = function (instance, td, row, col, prop, value, renderOptions) {
  var $td = $(td);
  var $text = $('<div style="position: relative;"></div>');
  var $arrow = $('<div class="htAutocomplete">&#x25BC;</div>');
  $arrow.mouseup(function(){
    $td.triggerHandler('dblclick.editor');
  });

  Handsontable.TextRenderer(instance, $text[0], row, col, prop, value, renderOptions);

  if($text.html() === '') {
    $text.html('&nbsp;');
  }

  $text.append($arrow);
  $td.empty().append($text);

  return td;
};