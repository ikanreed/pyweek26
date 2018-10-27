import pyglet

from pyglet import gl
from gameplay.Game import WaveStopperGame


class GameWindow:
    def __init__(self, width, height, starting_image):
        self.keystate=set()
        display=pyglet.canvas.get_display()
        screen=display.get_default_screen()
        config=pyglet.gl.Config(double_buffer=True)
        self.window=pyglet.window.Window(width, height+20, "Wave Stopper",True,pyglet.window.Window.WINDOW_STYLE_DEFAULT,
                                False,True,False,display,screen,config)
        self.window.push_handlers(on_draw=self.draw)
        self.window.push_handlers(on_key_press=self.keydown, on_key_release=self.keyup)
        self.activeScreen=WaveStopperGame(starting_image, self.window)
        pyglet.clock.schedule(self.update)
    def draw(self):
        self.activeScreen.draw(self.window)
    def update(self, dt):
        self.activeScreen.update(dt, self.keystate)
        pass
    def keydown(self,symbol, modifiers):
        self.keystate.add(symbol)
        
    def keyup(self, symbol, modifiers):
        self.keystate.remove(symbol)
        

    def run(self):
        pyglet.app.run()

