$(function(){
  $('#msg-confirm-btn').on('click', function(){
    const $container = $('.msg-container');
    $container.hide();
  });
});

export const showMessage = ({ message, onConfirm }) => {
  const $container = $('.msg-container');

  const $message = $('<p>').html(message);
  $('.msg-message').html($message);

  if(onConfirm){
    $('#msg-confirm-btn').on('click', function(){
      onConfirm();
    });
  }

  $container.show();
};