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

  const renderMedia = () => {
    if (!tweet.media) return null;

    // Handle array of media
    if (Array.isArray(tweet.media)) {
      return (
        <div
          className={`grid ${
            tweet.media.length > 1 ? "grid-cols-2" : "grid-cols-1"
          } gap-2 mt-2`}
        >
          {tweet.media.map((media, index) => (
            <img
              key={media.id || index}
              src={media.media_url_https || media.url}
              alt="Tweet media"
              className="w-full rounded-lg"
            />
          ))}
        </div>
      );
    }

    // Handle object with photo array
    if (tweet.media.photo && Array.isArray(tweet.media.photo)) {
      return (
        <div
          className={`grid ${
            tweet.media.photo.length > 1 ? "grid-cols-2" : "grid-cols-1"
          } gap-2 mt-2`}
        >
          {tweet.media.photo.map((photo, index) => (
            <img
              key={photo.id || index}
              src={photo.media_url_https}
              alt="Tweet media"
              className="w-full rounded-lg"
            />
          ))}
        </div>
      );
    }

    return null;
  };

  return (
    <div
      className={`${
        isQuoted ? "border border-gray-700/50 rounded-lg p-3 mt-2" : ""
      }`}
    >
      {!isQuoted && tweet.author && (
        <div className="flex items-center gap-2 mb-2">
          <img
            src={tweet.author.avatar}
            alt={tweet.author.name}
            className="w-5 h-5 rounded-full"
          />
          <div className="flex items-center gap-1">
            <span className="font-medium text-sm">{tweet.author.name}</span>
            {tweet.author.blue_verified && (
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
              `https://twitter.com/${tweet.author.screen_name}/status/${tweet.tweet_id}`,
              "_blank"
            );
          }}
          className="p-1.5 hover:bg-gray-800/50 rounded-full transition-colors"
        >
          <svg
            className="w-4 h-4 text-gray-400"
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path d="M18.36 5.64c-1.95-1.96-5.11-1.96-7.07 0L9.88 7.05 8.46 5.64l1.42-1.42c2.73-2.73 7.16-2.73 9.9 0 2.73 2.74 2.73 7.17 0 9.9l-1.42 1.42-1.41-1.42 1.41-1.41c1.96-1.96 1.96-5.12 0-7.07zm-2.12 3.53l-7.07 7.07-1.41-1.41 7.07-7.07 1.41 1.41zm-12.02 10.08l5.66-5.66 1.41 1.41-5.66 5.66-1.41-1.41zM17 4a1 1 0 100 2 1 1 0 000-2zM7 14a1 1 0 100 2 1 1 0 000-2z" />
          </svg>
        </button>
      </div>
      {renderMedia()}
      {tweet.quoted && <Tweet tweet={tweet.quoted} isQuoted={true} />}
      {!isQuoted && (
        <div className="flex items-center gap-6 mt-3 text-gray-400 text-xs">
          <div className="flex items-center gap-1">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M1.751 10c0-4.42 3.584-8 8.005-8h4.366c4.49 0 8.129 3.64 8.129 8.13 0 2.96-1.607 5.68-4.196 7.11l-8.054 4.46v-3.69h-.067c-4.49.1-8.183-3.51-8.183-8.01zm8.005-6c-3.317 0-6.005 2.69-6.005 6 0 3.37 2.77 6.08 6.138 6.01l.351-.01h1.761v2.3l5.087-2.81c1.951-1.08 3.163-3.13 3.163-5.36 0-3.39-2.744-6.13-6.129-6.13H9.756z" />
            </svg>
            <span>{formatNumber(tweet.replies)}</span>
          </div>
          <div className="flex items-center gap-1">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M4.5 3.88l4.432 4.14-1.364 1.46L5.5 7.55V16c0 1.1.896 2 2 2H13v2H7.5c-2.209 0-4-1.79-4-4V7.55L1.432 9.48.068 8.02 4.5 3.88zM16.5 6H11V4h5.5c2.209 0 4 1.79 4 4v8.45l2.068-1.93 1.364 1.46-4.432 4.14-4.432-4.14 1.364-1.46 2.068 1.93V8c0-1.1-.896-2-2-2z" />
            </svg>
            <span>{formatNumber(tweet.retweets)}</span>
          </div>
          <div className="flex items-center gap-1">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M16.697 5.5c-1.222-.06-2.679.51-3.89 2.16l-.805 1.09-.806-1.09C9.984 6.01 8.526 5.44 7.304 5.5c-1.243.07-2.349.78-2.91 1.91-.552 1.12-.633 2.78.479 4.82 1.074 1.97 3.257 4.27 7.129 6.61 3.87-2.34 6.052-4.64 7.126-6.61 1.111-2.04 1.03-3.7.477-4.82-.561-1.13-1.666-1.84-2.908-1.91zm4.187 7.69c-1.351 2.48-4.001 5.12-8.379 7.67l-.503.3-.504-.3c-4.379-2.55-7.029-5.19-8.382-7.67-1.36-2.5-1.41-4.86-.514-6.67.887-1.79 2.647-2.91 4.601-3.01 1.651-.09 3.368.56 4.798 2.01 1.429-1.45 3.146-2.1 4.796-2.01 1.954.1 3.714 1.22 4.601 3.01.896 1.81.846 4.17-.514 6.67z" />
            </svg>
            <span>{formatNumber(tweet.favorites)}</span>
          </div>
          {tweet.views !== null && (
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
    replies: PropTypes.number.isRequired,
    retweets: PropTypes.number.isRequired,
    favorites: PropTypes.number.isRequired,
    tweet_id: PropTypes.string.isRequired,
    author: PropTypes.shape({
      avatar: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
      blue_verified: PropTypes.bool,
      screen_name: PropTypes.string.isRequired,
    }).isRequired,
    media: PropTypes.oneOfType([
      PropTypes.arrayOf(
        PropTypes.shape({
          id: PropTypes.string,
          media_url_https: PropTypes.string,
          url: PropTypes.string,
        })
      ),
      PropTypes.shape({
        photo: PropTypes.arrayOf(
          PropTypes.shape({
            id: PropTypes.string,
            media_url_https: PropTypes.string,
          })
        ),
      }),
    ]),
    quoted: PropTypes.object,
  }).isRequired,
  isQuoted: PropTypes.bool,
};

const TwitterUsername = ({ meta }) => {
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

  if (!meta) return null;
  const person = meta.person_data;
  const { tweets } = meta;

  return (
    <div className="mt-2">
      {isExpanded ? (
        <div
          className="bg-gray-900 p-4 rounded-lg opacity-0 translate-y-4 overflow-hidden"
          style={{
            animation: isClosing
              ? "fadeOut 0.3s ease-out forwards"
              : "fadeUp 0.5s ease-out forwards",
          }}
          onClick={handleCollapse}
        >
          {/* Profile Header */}
          <div className="flex items-center gap-3 mb-4">
            <img
              src={person.avatar}
              alt={person.name}
              className="w-12 h-12 rounded-full"
            />
            <div>
              <div className="flex items-center gap-2">
                <span className="font-medium">{person.name}</span>
                {person.blue_verified && (
                  <BadgeCheck className="w-5 h-5 text-blue-400" />
                )}
                {person.affiliates?.label && (
                  <img
                    src={person.affiliates.label.badge.url}
                    alt={person.affiliates.label.description}
                    className="w-4 h-4"
                  />
                )}
              </div>
              <div className="text-gray-400 text-sm">@{person.profile}</div>
              <div className="text-gray-400 text-sm mt-1">{person.desc}</div>
            </div>
          </div>

          {/* Stats */}
          <div className="flex gap-4 text-sm mb-4">
            <div>
              <span className="font-medium">
                {person.friends.toLocaleString()}
              </span>
              <span className="text-gray-400 ml-1">Following</span>
            </div>
            <div>
              <span className="font-medium">
                {person.sub_count.toLocaleString()}
              </span>
              <span className="text-gray-400 ml-1">Followers</span>
            </div>
          </div>

          {/* Summary */}
          <div className="text-sm text-white mb-4">{meta.text}</div>

          {/* Tweets */}
          <div className="space-y-4">
            {tweets.pinned && (
              <div className="border-b border-gray-700/50 pb-4">
                <div className="text-xs text-gray-400 mb-2">Pinned Tweet</div>
                <Tweet tweet={tweets.pinned} />
              </div>
            )}
            {tweets.timeline?.map((tweet) => (
              <Tweet key={tweet.tweet_id} tweet={tweet} />
            ))}
          </div>
        </div>
      ) : (
        <div
          onClick={handleExpand}
          className="inline-flex items-center gap-2 bg-gray-900 rounded-lg px-3 py-2 cursor-pointer hover:bg-gray-800/50 transition-all duration-300"
        >
          <img
            src={person.avatar}
            alt={person.name}
            className="w-6 h-6 rounded-full"
          />
          <div>
            <div className="flex items-center gap-1">
              <span className="font-medium text-sm">{person.name}</span>
              {person.blue_verified && (
                <BadgeCheck className="w-4 h-4 text-blue-400" />
              )}
            </div>
            <div className="text-gray-400 text-xs">@{person.profile}</div>
          </div>
        </div>
      )}
    </div>
  );
};

TwitterUsername.propTypes = {
  meta: PropTypes.shape({
    text: PropTypes.string,
    person_data: PropTypes.shape({
      avatar: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
      profile: PropTypes.string.isRequired,
      desc: PropTypes.string,
      blue_verified: PropTypes.bool,
      friends: PropTypes.number.isRequired,
      sub_count: PropTypes.number.isRequired,
      affiliates: PropTypes.shape({
        label: PropTypes.shape({
          badge: PropTypes.shape({
            url: PropTypes.string.isRequired,
          }),
          description: PropTypes.string,
        }),
      }),
    }).isRequired,
    tweets: PropTypes.shape({
      pinned: PropTypes.object,
      timeline: PropTypes.arrayOf(PropTypes.object),
    }).isRequired,
  }),
};

export default TwitterUsername;
