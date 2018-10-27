from gameplay.Windows import GameWindow


def main(image_file,*args):
    game=GameWindow(1280, 960, image_file)
    game.run()

if __name__=="__main__":
    import sys
    main(*sys.argv[1:])