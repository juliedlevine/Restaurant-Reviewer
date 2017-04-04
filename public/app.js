$(document).ready(function() {
    $('.heart').click(function() {
        var id = $('#hidden-id').text();
        $(this).attr('src', '/like.png');
        $(this).css('pointer-events', 'none');
        $.ajax({
              type: "POST",
              url: '/restaurant/add_favorite/' + id,
              data: { favorite : true }
            });
    });


});
