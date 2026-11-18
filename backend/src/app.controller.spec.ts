import { AppController } from './app.controller.js';

describe('AppController', () => {
  it('responde que el servicio está activo', () => {
    expect(new AppController().health()).toEqual({ status: 'ok' });
  });
});
