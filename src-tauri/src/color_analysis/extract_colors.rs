use crate::models::{ColorCluster, WeightedPixel};
use palette::{color_difference::HyAb, Oklab};

const MATCH_PALETTE_K: usize = 12;
const KMEANS_MAX_ITERATIONS: usize = 20;

pub fn weighted_k_means(pixels: &[WeightedPixel]) -> Vec<(Oklab, f32)> {
    if pixels.is_empty() {
        return vec![];
    }
    // edge case: tiny image with not enough pixels
    let palette_size_k = MATCH_PALETTE_K.min(pixels.len());
    // K-means*++* -> centroids chosen by weighted distance to existing centroids
    let mut centroids = initiate_centroids(pixels, palette_size_k);
    let mut sums = vec![];

    for _ in 0..KMEANS_MAX_ITERATIONS {
        sums = calculate_cluster_sums(pixels, &centroids);
        // stopping signal to exit when colors stabilize
        let mut converged = true;

        for i in 0..palette_size_k {
            // zero assigned pixels -> replace with new optimal far pixel
            if sums[i].total_weight > 0.0 {
                let new_centroid = Oklab::new(
                    sums[i].sum_l / sums[i].total_weight,
                    sums[i].sum_a / sums[i].total_weight,
                    sums[i].sum_b / sums[i].total_weight,
                );
                if centroids[i].hybrid_distance(new_centroid) > 1e-3 {
                    converged = false;
                }
                centroids[i] = new_centroid;
            } else {
                let replacing_centroid = get_optimal_far_pixel(pixels, &centroids);
                if centroids[i].hybrid_distance(replacing_centroid) > 1e-3 {
                    converged = false;
                }
                centroids[i] = replacing_centroid;
            }
        }
        // means the color didn't really change, can stop iterating
        if converged {
            break;
        }
    }

    let palette = calculate_centroid_weights(&centroids, &sums);
    palette
}

fn initiate_centroids(pixels: &[WeightedPixel], k: usize) -> Vec<Oklab> {
    let mut centroids = Vec::with_capacity(k);

    // start with the most representative pixel as first centroid
    let max_weighted_pixel = pixels
        .iter()
        .max_by(|a, b| a.weight.partial_cmp(&b.weight).unwrap())
        .map(|pixel| pixel.lab)
        .unwrap_or(Oklab::new(0.5, 0.0, 0.0));
    centroids.push(max_weighted_pixel);

    // rest of centroids decided by weighted distance to existing centroids
    // balanced palette that represents all significant colors in the image, not just the most dominant ones
    while centroids.len() < k {
        centroids.push(get_optimal_far_pixel(pixels, &centroids));
    }

    centroids
}
fn calculate_cluster_sums(pixels: &[WeightedPixel], centroids: &[Oklab]) -> Vec<ColorCluster> {
    // creating centroid's cluster buckets to accumulate sums
    let mut sums = vec![ColorCluster::default(); centroids.len()];

    // every pixel assigned to nearest cluster and added with weight to that cluster's sum
    for pixel in pixels {
        let nearest = nearest_centroid(&pixel.lab, centroids);
        sums[nearest].add_weighted_pixel(pixel);
    }
    sums
}

// finds the index of the nearest centroid for a given pixel
fn nearest_centroid(lab: &Oklab, centroids: &[Oklab]) -> usize {
    centroids
        .iter()
        .enumerate()
        .min_by(|(_, c1), (_, c2)| {
            lab.hybrid_distance(**c1)
                .partial_cmp(&lab.hybrid_distance(**c2))
                .unwrap()
        })
        .map(|(index, _)| index)
        .unwrap_or(0)
}

// finds pixel that maximizes weighted distance from given centroids
fn get_optimal_far_pixel(pixels: &[WeightedPixel], centroids: &[Oklab]) -> Oklab {
    let mut best_score = -1.0_f32;
    let mut best_lab = pixels
        .first()
        .map(|pixel| pixel.lab)
        .unwrap_or(Oklab::new(0.5, 0.0, 0.0));

    for pixel in pixels {
        let min_dist = centroids
            .iter()
            .map(|c| pixel.lab.hybrid_distance(*c))
            .fold(f32::INFINITY, f32::min);

        // score based on distance and pixel weight
        let score = pixel.weight * min_dist.powi(2);
        if score > best_score {
            best_score = score;
            best_lab = pixel.lab;
        }
    }

    best_lab
}

fn calculate_centroid_weights(
    centroids: &[Oklab],
    cluster_sums: &[ColorCluster],
) -> Vec<(Oklab, f32)> {
    let total_weight: f32 = cluster_sums
        .iter()
        .map(|sum| sum.total_weight)
        .sum::<f32>()
        .max(1e-12);

    let mut weighted_centroids: Vec<(Oklab, f32)> = centroids
        .iter()
        .zip(cluster_sums.iter())
        .map(|(lab, cluster)| (*lab, cluster.total_weight / total_weight))
        .collect();

    // sort by weight
    weighted_centroids.sort_by(|a, b| b.1.partial_cmp(&a.1).unwrap());
    weighted_centroids
}
