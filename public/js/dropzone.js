$('.dropzone').on('dragenter',function(e){
  $(this).addClass('dragging');
  $(this).closest('.dropzone').addClass('dragging');

  $(this).delay(2000).queue(function(next){
    $(this).removeClass('dragging');
    next();
  });
});
$('.dropzone').on('drop',function(e){
  $(this).removeClass('dragging');
});

$('#destroyPreview').on('click', function(e){  //this is depricated.
  $('#preview').data('handsontable').destroy();
});

$('.dropzone').on('click',function(){  //highlight to point out choose file button

  $('.file-uploader', $(this).parent()).addClass("highlight").delay(500).queue(function(next){
      $(this).removeClass("highlight");
      next();
  });
})