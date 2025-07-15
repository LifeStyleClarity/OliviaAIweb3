import { useState } from "react";
import PropTypes from "prop-types";
import { BadgeCheck } from "lucide-react";

const Tweet = ({ tweet, isQuoted = false }) => {
  if (!tweet) return null;

  const formatNumber = (num) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year:
        date.getFullYear() !== new Date().getFullYear() ? "numeric" : undefined,
    });
  };

  return (
    <div
      className={`${
        isQuoted ? "border border-gray-700/50 rounded-lg p-3 mt-2" : ""
      }`}
    >
      {!isQuoted && tweet.user_info && (
        <div className="flex items-center gap-2 mb-2">
          <img
            src={tweet.user_info.avatar}
            alt={tweet.user_info.name}
            className="w-5 h-5 rounded-full"
          />
          <div className="flex items-center gap-1">
            <span className="font-medium text-sm">{tweet.user_info.name}</span>
            {tweet.user_info.verified && (
              <BadgeCheck className="w-4 h-4 text-blue-400" />
            )}
            <span className="text-gray-400 text-xs">·</span>
            <span className="text-gray-400 text-xs">
              {formatDate(tweet.created_at)}
            </span>
          </div>
        </div>
      )}
      <div className="flex items-center justify-between group">
        <div className="text-[12px] text-white">{tweet.text}</div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            window.open(
              `https://twitter.com/${tweet.screen_name}/status/${tweet.tweet_id}`,
              "_blank"
            );
          }}
          className="p-1.5 hover:bg-gray-800/50 rounded-full transition-colors"
        >
          <svg
            className="w-4 h-4 text-gray-400"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
            />
          </svg>
        </button>
      </div>
      {tweet.media?.photo && tweet.media.photo.length > 0 && (
        <div
          className={`grid ${
            tweet.media.photo.length > 1 ? "grid-cols-2" : "grid-cols-1"
          } gap-2 mt-2`}
        >
          {tweet.media.photo.map((photo) => (
            <img
              key={photo.id}
              src={photo.media_url_https}
              alt="Tweet media"
              className="w-full rounded-lg"
            />
          ))}
        </div>
      )}
      {!isQuoted && (
        <div className="flex items-center gap-6 mt-3 text-gray-400 text-xs">
          <div className="flex items-center gap-1">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M1.751 10c0-4.42 3.584-8 8.005-8h4.366c4.49 0 8.129 3.64 8.129 8.13 0 2.96-1.607 5.68-4.196 7.11l-8.054 4.46v-3.69h-.067c-4.49.1-8.183-3.51-8.183-8.01zm8.005-6c-3.317 0-6.005 2.69-6.005 6 0 3.37 2.77 6.08 6.138 6.01l.351-.01h1.761v2.3l5.087-2.81c1.951-1.08 3.163-3.13 3.163-5.36 0-3.39-2.744-6.13-6.129-6.13H9.756z" />
            </svg>
            <span>{formatNumber(tweet.replies || 0)}</span>
          </div>
          <div className="flex items-center gap-1">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M4.5 3.88l4.432 4.14-1.364 1.46L5.5 7.55V16c0 1.1.896 2 2 2H13v2H7.5c-2.209 0-4-1.79-4-4V7.55L1.432 9.48.068 8.02 4.5 3.88zM16.5 6H11V4h5.5c2.209 0 4 1.79 4 4v8.45l2.068-1.93 1.364 1.46-4.432 4.14-4.432-4.14 1.364-1.46 2.068 1.93V8c0-1.1-.896-2-2-2z" />
            </svg>
            <span>{formatNumber(tweet.retweets || 0)}</span>
          </div>
          <div className="flex items-center gap-1">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M16.697 5.5c-1.222-.06-2.679.51-3.89 2.16l-.805 1.09-.806-1.09C9.984 6.01 8.526 5.44 7.304 5.5c-1.243.07-2.349.78-2.91 1.91-.552 1.12-.633 2.78.479 4.82 1.074 1.97 3.257 4.27 7.129 6.61 3.87-2.34 6.052-4.64 7.126-6.61 1.111-2.04 1.03-3.7.477-4.82-.561-1.13-1.666-1.84-2.908-1.91zm4.187 7.69c-1.351 2.48-4.001 5.12-8.379 7.67l-.503.3-.504-.3c-4.379-2.55-7.029-5.19-8.382-7.67-1.36-2.5-1.41-4.86-.514-6.67.887-1.79 2.647-2.91 4.601-3.01 1.651-.09 3.368.56 4.798 2.01 1.429-1.45 3.146-2.1 4.796-2.01 1.954.1 3.714 1.22 4.601 3.01.896 1.81.846 4.17-.514 6.67z" />
            </svg>
            <span>{formatNumber(tweet.favorites || 0)}</span>
          </div>
          {tweet.views && (
            <div className="flex items-center gap-1">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M8.75 21V3h2v18h-2zM18 21V8.5h2V21h-2zM4 21l.004-10h2L6 21H4zm9.248 0v-7h2v7h-2z" />
              </svg>
              <span>{formatNumber(tweet.views)}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

Tweet.propTypes = {
  tweet: PropTypes.shape({
    text: PropTypes.string.isRequired,
    created_at: PropTypes.string.isRequired,
    views: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    replies: PropTypes.number,
    retweets: PropTypes.number,
    favorites: PropTypes.number,
    tweet_id: PropTypes.string.isRequired,
    screen_name: PropTypes.string.isRequired,
    user_info: PropTypes.shape({
      avatar: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
      verified: PropTypes.bool,
      screen_name: PropTypes.string.isRequired,
    }),
    media: PropTypes.shape({
      photo: PropTypes.arrayOf(
        PropTypes.shape({
          id: PropTypes.string.isRequired,
          media_url_https: PropTypes.string.isRequired,
        })
      ),
    }),
  }).isRequired,
  isQuoted: PropTypes.bool,
};

const TrendingTopics = ({ meta }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  const handleExpand = () => {
    setIsExpanded(true);
    setIsClosing(false);
  };

  const handleCollapse = () => {
    setIsExpanded(false);
    setIsClosing(true);
    setTimeout(() => {
      setIsClosing(false);
    }, 300);
  };

  if (!meta?.timeline) return null;

  return (
    <div className="mt-2">
      {isExpanded ? (
        <div
          className="bg-gray-900 rounded-xl opacity-0 translate-y-4 overflow-hidden"
          style={{
            animation: isClosing
              ? "fadeOut 0.3s ease-out forwards"
              : "fadeUp 0.5s ease-out forwards",
          }}
        >
          {/* Header */}
          <div className="p-3 border-b border-gray-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center p-1.5">
                  <img src="/x-logo.png" alt="X" className="w-full h-full" />
                </div>
                <div>
                  <div className="text-sm font-medium">Twitter Discussion</div>
                  <div className="text-xs text-gray-500">
                    {meta.timeline.length} tweets
                  </div>
                </div>
              </div>
              <button
                onClick={handleCollapse}
                className="p-1 hover:bg-gray-800 rounded-full transition-colors"
              >
                <svg
                  className="w-5 h-5 text-gray-400"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
            <div className="mt-2 text-sm text-gray-300">
              {meta.text || "Recent tweets about this topic"}
            </div>
          </div>

          {/* Tweets */}
          <div className="divide-y divide-gray-800">
            {meta.timeline.map((tweet) => (
              <div
                key={tweet.tweet_id}
                className="p-3 hover:bg-gray-800/50 transition-colors"
              >
                <Tweet tweet={tweet} />
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div
          onClick={handleExpand}
          className="group inline-flex items-center gap-3 bg-gray-900/80 hover:bg-gray-900 rounded-lg px-3 py-2 cursor-pointer transition-all duration-300"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center p-1.5">
              <img src="/x-logo.png" alt="X" className="w-full h-full" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs text-gray-400 line-clamp-2">
                {meta.text || "View Twitter Discussion"}
              </div>
              <div className="flex items-center gap-1 mt-0.5">
                <div className="text-[11px] text-gray-500">
                  {meta.timeline.length} tweets
                </div>
                <svg
                  className="w-3 h-3 text-gray-500 transform group-hover:translate-x-0.5 transition-all duration-300"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

TrendingTopics.propTypes = {
  meta: PropTypes.shape({
    text: PropTypes.string,
    status: PropTypes.string,
    timeline: PropTypes.arrayOf(
      PropTypes.shape({
        tweet_id: PropTypes.string.isRequired,
      })
    ).isRequired,
  }),
};

export default TrendingTopics;
