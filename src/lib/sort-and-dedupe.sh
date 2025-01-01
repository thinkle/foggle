#!/bin/bash

# Check if the input file is provided
if [ $# -eq 0 ]; then
  echo "Usage: $0 <file>"
  exit 1
fi

# Input file
input_file=$1

# Check if the input file exists
if [ ! -f "$input_file" ]; then
  echo "File not found: $input_file"
  exit 1
fi

# Sort and deduplicate the file in place
temp_file=$(mktemp)
sort "$input_file" | uniq > "$temp_file" && mv "$temp_file" "$input_file"

echo "File has been sorted and deduplicated: $input_file"