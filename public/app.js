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

    $('#new_user').click(function() {
        $.ajax({
            url: "/add_user",
            type: "POST",
            data: {
                username: $('.username').val(),
                email: $('.email').val(),
                password: $('.password').val(),
                confirm: $('.confirm_password').val()
            }
        })
        .then(function(response) {
            if (response === 'match') {
                window.location.href = '/';
            } else if (response === 'not match'){
                swal({
                    title: "Error!",
                    text: "Passwords do not match",
                    type: "error",
                    confirmButtonText: "Try again"
                });
            } else if (response === 'failure') {
                window.location.href = '/login_fail';
            } else if (response === 'empty') {
                swal({
                    title: "Error!",
                    text: "You must fill out all the fields!",
                    type: "error",
                    confirmButtonText: "Cool"
                });
            }

        });
    });


});
