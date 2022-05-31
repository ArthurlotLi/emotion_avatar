#
# gif_generator.py
#
# Given the contents of emotion_media, generates gifs using ffmpeg. 

import os

from pathlib import Path

_emotion_media_location = Path("emotion_media")
_output_media_location = Path("avatar")

_gif_duration = 5
_fps = 24
_scale = 800

def convert_gifs():
  source_dir = str(_emotion_media_location)
  assert Path(source_dir).exists()
  destination_dir = str(_output_media_location)

  # Housekeeping - ensure the destination folder is clean.
  if os.path.exists(destination_dir):
    existing_files = os.listdir(destination_dir)
    if len(existing_files) > 0:
      print("[INFO] Sample Generator - %d existing files found in %s. Overwrite?\n\nPress [Enter] to Overwrite." 
        % (len(existing_files), destination_dir))
      input()
      for file in existing_files:
        os.remove(str(Path(destination_dir).joinpath(file)))
  
  Path(destination_dir).mkdir(exist_ok=True)
  assert len(os.listdir(destination_dir)) == 0

  # All set. Let's generate the files from the existing files
  emotion_media_files = os.listdir(source_dir)
  for file in emotion_media_files:
    file_path = Path(source_dir).joinpath(file)
    output_path = Path(destination_dir).joinpath(file.replace(".mp4", ".gif"))
    os.system("ffmpeg -t %d -i %s -vf \"fps=%d,scale=%d:-1:flags=lanczos,split[s0][s1];[s0]palettegen[p];[s1][p]paletteuse\" -loop 0 %s" 
      % (_gif_duration, file_path, _fps, _scale, output_path))


if __name__ == "__main__":
  convert_gifs()