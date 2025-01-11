- Build "switch" interface
- Build history & streaks interface


- Implement daily puzzle [x]
  - 1. Build pre-processing step for wordlist: [x]
      - Use answerList to generate a sorted list of encoded words. [x]
      - Get our clue by going in order through answerList (daily) or randomly (infinite) [x]
      - Make build process maintain word order through current day but shuffle remaining words whenever the word list updates. [x]