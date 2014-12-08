$(document).ready(function () {

  $('#tags').tagsInput({
    'height':'60px',
    'width':'280px'
  });
   $('.pop').popover() //Required to make popovers work in boostrap world

   $('#tooltipSelection').popover({content:'<p>tooltipSelection<a class="next">go!</a></p>',html:true,title:'tooltipSelection', trigger:'manual'})
   $('#tooltipCopyCut').popover({content:'<p>tooltipCopyCut<a class="next2">go!</a></p>',html:true,title:'CopyCut', trigger:'manual'})
   $('#tooltipAutofill').popover({content:'tooltipAutofill',html:true, trigger:'manual'})

  //$('#tooltipSelection').popover('show')
 //   // $('#tooltipCopyCut').popover('show')
 //   // $('#tooltipAutofill').popover('show')
	// // $('.pop').popover('hide')
	// //       $(".csv-instrucions").fadeIn();

 //     // $(".csv-instrucions").fadeIn();
     
	$('.next').on('click', function(){
	 $('#tooltipAutofill').popover('show');
	});
  
  if ($('.alert-wrap').length>0){
    $('.container, .navigation').one('click',function(){
        $('.alert-wrap').remove()
    });   
  };


});

