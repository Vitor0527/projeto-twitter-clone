export function tweetListKey(tweet) {
  const actor = tweet.retweetedBy?.id || tweet.authorId;
  return `${tweet.timelineType || 'tweet'}-${tweet.id}-${actor}-${tweet.sortAt || tweet.createdAt}`;
}

export function toggleLikeInList(tweets, tweetId, userId) {
  return tweets.map((tweet) => {
    if (tweet.id !== tweetId) return tweet;
    const liked = (tweet.likedBy || []).map(String).includes(String(userId));
    return {
      ...tweet,
      likedBy: liked
        ? tweet.likedBy.filter((id) => String(id) !== String(userId))
        : [...(tweet.likedBy || []), userId],
    };
  });
}

export function toggleRepostInList(tweets, tweetId, userId) {
  return tweets.map((tweet) => {
    if (tweet.id !== tweetId) return tweet;
    const reposted = (tweet.repostedBy || []).map(String).includes(String(userId));
    return {
      ...tweet,
      repostedBy: reposted
        ? tweet.repostedBy.filter((id) => String(id) !== String(userId))
        : [...(tweet.repostedBy || []), userId],
    };
  });
}
