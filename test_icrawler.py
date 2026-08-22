from icrawler.builtin import BingImageCrawler
import os

def test_icrawler():
    crawler = BingImageCrawler(storage={'root_dir': 'test_icrawler_dir'})
    crawler.crawl(keyword='hoa cẩm tú cầu', max_num=5)

if __name__ == "__main__":
    test_icrawler()
