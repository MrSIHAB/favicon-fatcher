import {DOMParser} from "https://deno.land/x/deno_dom/deno-dom-wasm.ts";
import {fetchImage} from "./fetchImage.ts";
import {getWebStandardUrl} from "./getWebStandardUrl.ts";
import {getManifestIcon} from "./getManifestIcon.ts";
import {imageResponse} from "./types.ts";

const parser = new DOMParser();

/*
 * This function will try to get favicon link and fetch it from link tag,
 * then it will try to get from manifest file if included.
 * After all it will try to fetch from default url link url/favicon.ico
 */
export const getFavicon = async (
  url: string,
): Promise<imageResponse | null> => {
  // const baseUrl = new URL(url).origin;
  let faviconLink = null;
  const response = await fetch(url);
  const html = await response.text();
  const document = parser.parseFromString(html, "text/html");

  /**
   * This Part is for finding favicon link from document's metadata.
   */
  // getting favicon Url from Link tag;
  const faviconMetaData = document.querySelector("link[rel='shortcut icon']") ||
    document.querySelector("link[rel='icon']");
  if (faviconMetaData) {
    faviconLink = faviconMetaData.getAttribute("href");
  }

  /// ? Returning Image Buffer
  /*
   * if link starts with https or http, we won't touch it
   * mapping "//" to "https://"
   * "/" means "baseUrl/link" and No "/" means "baseurl/current page/link"
   */
  if (faviconLink) {
    const link = getWebStandardUrl(url, faviconLink);
    return fetchImage(link);
  }

  const manifestTag = document.querySelector("link[rel='mamifest']");
  if (manifestTag) {
    const manifestLink = manifestTag.getAttribute("href");
    if (manifestLink) {
      const link = getWebStandardUrl(url, manifestLink);
      return getManifestIcon(link.toString());
    }
  }

  /**
   * This Part has last priority. Fetching from Default location. (example.com/favicon.ico)
   */

  return fetchImage(new URL("/favicon.ico", url));
};
