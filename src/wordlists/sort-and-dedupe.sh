#!/bin/bash

# Default file names
default_input_file="answerList.txt"
default_all_words_file="allTheWords.txt"

# Use provided arguments or default files
input_file=${1:-$default_input_file}
all_words_file=${2:-$default_all_words_file}

# Check if the input file exists
if [ ! -f "$input_file" ]; then
  echo "File not found: $input_file"
  exit 1
fi

# Check if the all words file exists
if [ ! -f "$all_words_file" ]; then
  echo "File not found: $all_words_file"
  exit 1
fi

# Temporary files
temp_file=$(mktemp)
removed_file="removed_words.txt"

# Sort and deduplicate the master list to ensure consistency
sort -u "$all_words_file" -o  "$all_words_file"

# Remove trailing whitespace from the input file
sed -i '' 's/[[:space:]]*$//' "$input_file"

# Get the starting word count of the input file
starting_count=$(wc -l < "$input_file")

# Sort and deduplicate the input file
sort -u "$input_file" > "$temp_file"

# Filter: Keep only words present in the sorted master list
comm -12 "$temp_file" "$all_words_file" > "${temp_file}.filtered"

# Find and save removed words (not in the master list)
comm -23 "$temp_file" "$all_words_file" > "$removed_file"

# Get the filtered and unique word count
filtered_count=$(wc -l < "${temp_file}.filtered")
removed_count=$(wc -l < "$removed_file")

# Output summary to the user
echo "Starting wordcount: $starting_count"
echo "Filtered and unique wordcount: $filtered_count"
echo "Removed words: $removed_count"
echo "Removed words saved in: $removed_file"

# Prompt the user to confirm overwriting the original file
read -p "Overwrite $input_file with the filtered list? (y/n): " confirm

if [[ $confirm == "y" || $confirm == "Y" ]]; then
  mv "${temp_file}.filtered" "$input_file"
  echo "File has been updated: $input_file"
else
  echo "File was not modified."
fi

# Cleanup temporary files
rm -f "$temp_file" "${temp_file}.filtered"