const TypingDots = () => {
  return (
    <div className="flex gap-[3px] px-[1px]">
      {[1, 2, 3].map((dot) => (
        <div
          key={dot}
          className="w-[3px] h-[3px] rounded-full bg-gray-300 animate-[wave_1.3s_ease-in-out_infinite]"
          style={{
            animationDelay: `${(dot - 1) * 0.3}s`
          }}
        />
      ))}
    </div>
  );
};

export default TypingDots;
