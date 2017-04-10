$(document).ready(function() {
    $('.heart').click(function() {
        var id = $('#hidden-id').text();
        if ($(this).hasClass('not-favorite')) {
            swal("Success!", "Added to your favorites!", "success");
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

    function check(response) {
        $('.first').val('');
        $('.last').val('');
        $('.username').val('');
        $('.email').val('');
        $('.password').val('');
        $('.confirm_password').val('');

        if (response === 'match') {
            window.location.href = '/user_home';
        } else if (response === 'not match'){
            swal({
                title: "Error!",
                text: "Passwords do not match",
                type: "error",
                confirmButtonText: "Try again"
            });
        } else if (response === 'fail') {
            swal({
                title: "Error!",
                text: "Try again",
                type: "error",
                confirmButtonText: "Try again"
            });
        } else if (response === 'empty') {
            swal({
                title: "Error!",
                text: "You must fill out all the fields!",
                type: "error",
                confirmButtonText: "Cool"
            });
        } else if (response === 'taken') {
            swal({
                title: "Error!",
                text: "Username already taken!",
                type: "error",
                confirmButtonText: "Cool"
            });
        }

    }

    $('#submit_login').click(function() {
        $.ajax({
            url: "/submit_login",
            type: "POST",
            data: {
                username: $('.username').val(),
                password: $('.password').val(),
            }
        })
        .then(function(response) {
            check(response);
        })
        .catch(function(err) {
            console.log(err.message);
        });
    });

    $('#new_user').click(function() {
        $.ajax({
            url: "/add_user",
            type: "POST",
            data: {
                first: $('.first').val(),
                last: $('.last').val(),
                username: $('.username').val(),
                email: $('.email').val(),
                password: $('.password').val(),
                confirm: $('.confirm_password').val()
            }
        })
        .then(function(response) {
            check(response);
        })
        .catch(function(err) {
            console.log(err.message);
        });
    });


});
