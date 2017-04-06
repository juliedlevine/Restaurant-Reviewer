$(document).ready(function() {
    $('.heart').click(function() {
        var id = $('#hidden-id').text();
        if ($(this).hasClass('not-favorite')) {
            $(this).attr('src', '/like.png').addClass('favorite').removeClass('not-favorite');
            $.ajax({
                  type: "POST",
                  url: '/restaurant/add_favorite/' + id,
                  data: { favorite : true }
                });
        } else if ($(this).hasClass('favorite')) {
            $(this).attr('src', '/heart.png').addClass('not-favorite').removeClass('favorite');
            $.ajax({
                  type: "POST",
                  url: '/restaurant/add_favorite/' + id,
                  data: { favorite : false }
                });
        }
    });


    $('#stars').barrating({
       theme: 'fontawesome-stars'
    });

});
