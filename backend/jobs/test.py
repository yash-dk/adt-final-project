import yfinance as yf

# Define the ticker symbol
ticker_symbol = "AAPL"

# Fetch ticker data
ticker = yf.Ticker(ticker_symbol)

# Fetch recent news
news_items = ticker.news

# Print the news
print(f"Latest news for {ticker_symbol}:\n")
for news in news_items:
    print(f"Title: {news['content']['title']}")
    print(f"Publisher: {news['content']['provider']['displayName']}")
    print(f"Link: {news['content']['provider']['url']}")
    print(f"Published: {news['content']['pubDate']}")
    print(f"Summary: {news['content']['summary']}")
    print("-" * 80)
