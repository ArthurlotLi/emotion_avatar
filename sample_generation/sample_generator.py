#
# sample_generator.py
#
# Given an input test_annotated.csv, utilize multispeaker synthesis 
# to conduct inference and generate wav files that may be presented 
# in the application.
#
# Usage:
# python sample_generator.py

import sys
import os
from pathlib import Path
import re
from pydub import AudioSegment
import pandas as pd

sys.path.append("../../multispeaker_synthesis")

from production_inference import * 

# Multispeaker Synthesis parameters.
_vocoder = "sv2tts"
_model_num = "model6"
_model_num_synthesizer = "model6"
_synthesizer_fpath = Path("../../multispeaker_synthesis/production_models/synthesizer/"+_model_num_synthesizer+"/synthesizer.pt")
_speaker_encoder_fpath = Path("../../multispeaker_synthesis/production_models/speaker_encoder/"+_model_num+"/encoder.pt")
#_embeds_fpath = Path("../../multispeaker_synthesis_speakers/")
_embeds_fpath = Path("../../kotakee_companion/assets_audio/multispeaker_synthesis_speakers/")

# Quality of the produced samples. 
_target = 2000
_overlap = 400
_batched = False
_speaker = "VELVET"

# Other parameters
_test_annotated = "test_annotated.csv"
_destination_dir = "test_annotated"
_total_samples = 10

def generate_samples():

  destination_dir = _destination_dir

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

  # All set. Let's generate the files from the csv files.
  test_annotated_df = pd.read_csv(_test_annotated)
  print(test_annotated_df)
  input()

  multispeaker_synthesis = MultispeakerSynthesis(synthesizer_fpath=_synthesizer_fpath,
    speaker_encoder_fpath=_speaker_encoder_fpath, target=_target, overlap=_overlap, 
    batched=_batched)

  for a in range(len(speaker_samples_json)):
    segment = speaker_samples_json[a]

    for speaker in segment:
      samples = segment[speaker]
      assert type(samples) == list
      for i in range(len(samples)):
        sample_pair = samples[i]
        assert type(sample_pair) == dict
        assert len(sample_pair) == 1
        for transcript in sample_pair:
          sample_filename = str(Path(destination_dir).joinpath("%d_%s_%d.wav" % (a, speaker, i)))
          print("[INFO] Sample Generator - Processing: %s." % Path(sample_filename).name)

          sample = sample_pair[transcript]
          # Speak each sample. 
          text_to_speak = [sample]
          split_sentence_re = r'[\.|!|,|\?|:|;|-] '

          # The only preprocessing we do here is to split sentences into
          # different strings. This makes the pronunciation cleaner and also
          # makes inference faster (as it happens in a batch).
          processed_texts = []
          for text in text_to_speak:
            split_text = re.split(split_sentence_re, text)
            processed_texts += split_text
            processed_texts

          wavs = multispeaker_synthesis.synthesize_audio_from_embeds(texts = processed_texts, 
            embeds_fpath = Path(_embeds_fpath).joinpath(speaker + ".npy"), 
            vocoder = _vocoder)
          
          assert len(wavs) == 1

          # save the wav. 
          wav = wavs[0]
          audio.save_wav(wav, sample_filename, sr=hparams.sample_rate)
          # Normalize the audio. Not the best code, but it works in ~0.007 seconds.
          wav_suffix = sample_filename.rsplit(".", 1)[1]
          sound = AudioSegment.from_file(sample_filename, wav_suffix)
          change_in_dBFS = -15.0 - sound.dBFS
          normalized_sound = sound.apply_gain(change_in_dBFS)
          normalized_sound.export(sample_filename, format=wav_suffix)

          # For cheaper uploading, use .mp3 instead of uncompressed .wavs. 
          #print("[INFO] Sample Generator - Converting from wav to mp3 with PyDub...")
          #AudioSegment.from_wav(sample_filename).export(sample_filename.replace(".wav", ".mp3"), format="mp3")
          #os.remove(sample_filename)

          # All done with this!

if __name__ == "__main__":
  generate_samples()