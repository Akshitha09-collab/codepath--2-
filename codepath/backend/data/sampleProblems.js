/**
 * data/sampleProblems.js
 * ----------------------
 * Sample problem catalog covering the topics discussed in the project brief
 * (Arrays, Strings, Trees, Graphs, Dynamic Programming) plus a few extra
 * DSA topics so the topic-similarity fallback in the recommender has more
 * to work with. Loaded by seed.js.
 */

const topics = {
  "Arrays": [
    "Two Sum", "Best Time to Buy and Sell Stock", "Product of Array Except Self",
    "Maximum Subarray", "Rotate Array", "Merge Intervals", "3Sum",
    "Container With Most Water", "Find Duplicate Number",
  ],
  "Strings": [
    "Valid Anagram", "Longest Substring Without Repeating Characters",
    "Group Anagrams", "Valid Parentheses", "Longest Palindromic Substring",
    "String to Integer (atoi)", "Minimum Window Substring",
  ],
  "Trees": [
    "Binary Tree Inorder Traversal", "Binary Tree Level Order Traversal",
    "Maximum Depth of Binary Tree", "Validate Binary Search Tree",
    "Symmetric Tree", "Lowest Common Ancestor of a BST",
    "Construct Binary Tree from Preorder and Inorder",
  ],
  "Graphs": [
    "Number of Islands", "Course Schedule", "Clone Graph", "Word Ladder",
    "Graph Valid Tree", "Network Delay Time", "Redundant Connection",
    "Pacific Atlantic Water Flow",
  ],
  "Dynamic Programming": [
    "0/1 Knapsack", "Climbing Stairs", "Coin Change",
    "Longest Increasing Subsequence", "House Robber", "Edit Distance",
    "Unique Paths", "Longest Common Subsequence",
  ],
  "Recursion": [
    "Permutations", "Subsets", "Combination Sum", "N-Queens", "Generate Parentheses",
  ],
  "Greedy": [
    "Jump Game", "Gas Station", "Task Scheduler", "Non-overlapping Intervals",
  ],
  "Linked List": [
    "Reverse Linked List", "Merge Two Sorted Lists", "Linked List Cycle",
    "Remove Nth Node From End",
  ],
  "Stacks": [
    "Min Stack", "Daily Temperatures", "Largest Rectangle in Histogram",
  ],
  "Two Pointers": [
    "Two Sum II", "Trapping Rain Water", "Sort Colors",
  ],
};

const difficultyCycle = ["Easy", "Easy", "Medium", "Medium", "Hard"];

function buildProblems() {
  const problems = [];
  let id = 1;
  for (const [topic, titles] of Object.entries(topics)) {
    titles.forEach((title, idx) => {
      problems.push({
        problemId: id,
        title,
        topic,
        difficulty: difficultyCycle[idx % difficultyCycle.length],
        tags: [topic.toLowerCase()],
        link: `https://leetcode.com/problems/${title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
      });
      id += 1;
    });
  }
  return problems;
}

module.exports = buildProblems();
