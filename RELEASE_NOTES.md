# Version 0.1

This is an *early early* beta (only slightly past alpha). There is lots to do, but it has the MAP (Minimum Acceptable Product) features.

## Current Features:
 * Reads a folder and its subfolder
   * All previously unseen sound files are added to the database with a "pending review tag"
   * "pending review" tag is removed the first time information is added (or just the sample info is saved without changes) 
 * Speed browsing
   * Select a file, then use S & K keys to skip (not liked) or keep (liked) and move on to the next in the list.
 * "Link" to a license file on the disk.
 * Tag files with searchable tags.
 * Create file sets, based on searches, that are otherwise treated like file sets from directories.
 * Mac Only

## Priority Updates for V 0.2
 * Highlight currently playing file in file picker
   * Do so without impacting a11y features or keyboard navigation
 * Improvement of a11y based on tester feedback 
 * Improvement of keyboard navigation features based on tester feedback
 * Enable Autoplay control? (currently always autoplays, but should it be on/off by default and should there be a setting?)
   * NOTE this feature is /* commented */ out, but exists in a rudimentary form
 * Clean/dirty: file is considered dirty if any file data changes are made
   * popup asks if you want to save files before moving on, holds focus, can be dismissed with click on close button or Y or N
 * Autosuggest Creators based on prior ones (like tags)
 * If adding a new Creator to a file, ask if all files in the same folder as that one (or all files in picker) should be assigned that Creator.
 * If adding a new License to a file, ask if all files in the same folder as that one (or all files in picker) should be assigned that License.
 * Useful UI improvements / clean-up
 * Test (and hopefully release) Windows X86_64 and Windows on ARM builds
 * Test (and hopefully release) Linux X86_64 and Linux on ARM builds

## ==========================
## ROADMAP BEYOND V0.2
## ==========================

### Guided Tour
  - Make one
    - Offer at any time (button in corner or tab)
    - Offer after accepting T&C

### Terms and Conditions
  - Make one that's more professional sounding

### TAGGING:
  - Tag entries in the database have additional fields
    - Enable their use
    - Make those fields searchable?
  - Better auto-tagging (beyond current BPM)
    - Have list of keywords looked for in full paths and add tags if matched
    - Make list editable by user?

### MIDI:
  - in V0.1 it's just a tone generator, no soundfonts
    - "tone" library (part of the midi player) seems to require a JSON map of the instruments in a soundfont
    - it may be possible to manually make one or find some decent sf2 with associated jsons
    - These can add hundreds of megabytes, so possibly make them user-installable extensions instead of part of app package

        References:
        https://github.com/gleitz/midi-js-soundfonts?tab=readme-ov-file (contains info on soundfonts that may work with existing player)
          and possibly a lead on how to deconstruct an SF2 file into a format html-midi-player can use.

### Security:
 - Make sure the file is actually the mime type it claims, check for ways to exploit Howler and our MidiPlayer
 - Additional security improvements based on testing

### Exports:
  - export all sounds for a tag
    - as zip?
    - as m3u playlist?
    - ???
    - profit! (joke from the ancient internet)

### Cloud Storage:
  - create plugin architecture for external API clients?
  - save Loki database in cloud storage
    - cloud storage as a logical drive like OneDrive/GoogleDrive with desktop apps
    - use vendor specific APIs
  - use sound collection in cloud storage
    - cloud storage as a logical drive like OneDrive/GoogleDrive with desktop apps
      - What if file name is listed in local drive but needs to be downloaded before use?
    - use vendor specific APIs
  - back-up database locally
    - to ~/.SamplesOrganizer with a date.bak filename
    - to anywhere on disk/network
  - Change Default Database
    - local database (mongo, postgres, maria)
    - cloud/remote database (mongo, postgres, maria, etc.)
    - ORM plugins for alt databases

### Expand formats
  - add support for more audio formats
    - add or swap in alternative engines
    - add support to Howler and submit additions upstream
      - Complicated because Howler hasn't accepted a pull request in over a year (may need to maintain our own fork)

### Clean Up UI
  - Improve design functionality
  - Improve design aesthetics
  - Improve cross-platform similarity if needed (doesn't need to be EXACT, but fix glaring issues)

### A11Y / Comfort
  - Improve based on feedback for actual A11Y issues
  - Dark mode
  - Additional optional settings

### File management
  - Allow to move / copy liked files to a new folder
  - Allow to move / copy disliked files to a new folder or trash
  - Better auto analysis of files
  - Better use of metadata features in certain filetypes
