// Sample scripture data for the app
const SCRIPTURES = [
  {
    verse: "Bring the whole tithe into the storehouse, that there may be food in my house. Test me in this, says the LORD Almighty, and see if I will not throw open the floodgates of heaven and pour out so much blessing that there will not be room enough to store it.",
    reference: "Malachi 3:10"
  },
  {
    verse: "Each of you should give what you have decided in your heart to give, not reluctantly or under compulsion, for God loves a cheerful giver.",
    reference: "2 Corinthians 9:7"
  },
  {
    verse: "Honor the LORD with your wealth, with the firstfruits of all your crops; then your barns will be filled to overflowing, and your vats will brim over with new wine.",
    reference: "Proverbs 3:9-10"
  },
  {
    verse: "A generous person will prosper; whoever refreshes others will be refreshed.",
    reference: "Proverbs 11:25"
  },
  {
    verse: "But who am I, and who are my people, that we should be able to give as generously as this? Everything comes from you, and we have given you only what comes from your hand.",
    reference: "1 Chronicles 29:14"
  },
  {
    verse: "Give, and it will be given to you. A good measure, pressed down, shaken together and running over, will be poured into your lap. For with the measure you use, it will be measured to you.",
    reference: "Luke 6:38"
  },
  {
    verse: "Remember this: Whoever sows sparingly will also reap sparingly, and whoever sows generously will also reap generously.",
    reference: "2 Corinthians 9:6"
  },
  {
    verse: "Do not store up for yourselves treasures on earth, where moths and vermin destroy, and where thieves break in and steal. But store up for yourselves treasures in heaven, where moths and vermin do not destroy, and where thieves do not break in and steal.",
    reference: "Matthew 6:19-20"
  },
  {
    verse: "In everything I did, I showed you that by this kind of hard work we must help the weak, remembering the words the Lord Jesus himself said: 'It is more blessed to give than to receive.'",
    reference: "Acts 20:35"
  },
  {
    verse: "And do not forget to do good and to share with others, for with such sacrifices God is pleased.",
    reference: "Hebrews 13:16"
  },
];

/**
 * Get a random scripture from the collection
 * @returns {Object} A scripture object with verse and reference
 */
export const getRandomScripture = () => {
  const randomIndex = Math.floor(Math.random() * SCRIPTURES.length);
  return SCRIPTURES[randomIndex];
};

/**
 * Get a specific scripture by reference
 * @param {string} reference The scripture reference to look for
 * @returns {Object|null} The scripture object or null if not found
 */
export const getScriptureByReference = (reference) => {
  return SCRIPTURES.find(scripture => scripture.reference === reference) || null;
};

/**
 * Get all scriptures
 * @returns {Array} All scripture objects
 */
export const getAllScriptures = () => {
  return SCRIPTURES;
};

/**
 * Search scriptures by keyword
 * @param {string} keyword The keyword to search for
 * @returns {Array} Matching scripture objects
 */
export const getScripturesByKeyword = (keyword) => {
  const lowerKeyword = keyword.toLowerCase();
  return SCRIPTURES.filter(scripture => 
    scripture.verse.toLowerCase().includes(lowerKeyword) || 
    scripture.reference.toLowerCase().includes(lowerKeyword)
  );
};