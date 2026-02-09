import xapi from 'xapi';

const TEA_APP_URL = 'https://teaapp.twaasol.com/tenant/room/room_c5b74cf97a46f7a722a8d8d52c9cf96d26f849bbc201707d0e8c89428117981b';

async function openTeaApp() {
  try {
    await xapi.Command.UserInterface.WebView.Display({
      Url: TEA_APP_URL,
      Target: 'Controller'
    });
    console.log('Tea App Opened');
  } catch (error) {
    console.error('Error opening Tea App:', error);
  }
}

async function closeTeaApp() {
  try {
    await xapi.Command.UserInterface.WebView.Clear();
    console.log('Tea App Closed');
  } catch (error) {
    console.error('Error closing Tea App:', error);
  }
}

xapi.Event.UserInterface.Extensions.Widget.Action.on(event => {

  if (event.WidgetId === 'tea_open' && event.Type === 'released') {
    openTeaApp();
  }

  if (event.WidgetId === 'tea_close' && event.Type === 'released') {
    closeTeaApp();
  }

  if (event.WidgetId === 'tea_close_button' && event.Type === 'released') {
    closeTeaApp();
  }

});
