import pyglet

from pyglet import gl
from gameplay.Game import WaveStopperGame


class GameWindow:
    def __init__(self, width, height):
        display=pyglet.canvas.get_display()
        screen=display.get_default_screen()
        config=pyglet.gl.Config(double_buffer=True)
        self.window=pyglet.window.Window(640, 580, "Wave Stopper",True,pyglet.window.Window.WINDOW_STYLE_DEFAULT,
                                False,True,False,display,screen,config)
        self.window.push_handlers(on_draw=self.draw)
        self.activeScreen=WaveStopperGame('testlevel', self.window)
        pyglet.clock.schedule(self.update)
    def draw(self):
        self.activeScreen.draw(self.window)
    def update(self, dt):
        self.activeScreen.update(dt)
        pass
    def run(self):
        pyglet.app.run()

