#
# singular_sample.py
#
# Small utility for generating touch-up .wavs to replace bad samples
# generated in bulk. 
#
# Usage: 
# python singular_sample.py "Welcome to the Tales of Skits website|Where Artificial Intelligence meets the Tales of video game series!" "JUDE|EDNA"

import argparse

from sample_generator import generate_samples

def define_singular_sample(sample_text: str, sample_speaker: str):
  """
  Creates inner dict (2nd level in) object for this utterance. 
  """
  output_dict = {
    sample_speaker : [
      {
        sample_text :
        sample_text
      }
    ]
  }

  return output_dict

def process_samples(sample_texts: str, sample_speakers: str):
  """
  Given |-separated strings (of equal length) for speakers and
  Utterances, produce the results. 
  """
  sample_texts_list = sample_texts.split("|")
  sample_speakers_list = sample_speakers.split("|")

  assert len(sample_texts_list) == len(sample_speakers_list)

  singular_samples = []

  for i in range(len(sample_texts_list)):
    singular_samples.append(define_singular_sample(
      sample_text = sample_texts_list[i],
      sample_speaker=sample_speakers_list[i]
    ))
  
  # Use the singular_samples optional argument for sample_generator.
  generate_samples(singular_samples=singular_samples)


if __name__ == "__main__":
  parser = argparse.ArgumentParser()
  parser.add_argument("sample_texts", type=str)
  parser.add_argument("sample_speakers", type=str)
  args = parser.parse_args()

  process_samples(**vars(args))